#!/usr/bin/env python3
"""Deploy de produção do api_crm na VPS.

Roda com: npm run deploy-production

Lê as credenciais/caminhos do .env do projeto e, via SSH, executa no servidor:
  1. git pull (alinha o branch local ao origin)
  2. npm install
  3. npx prisma generate
  4. npm run build
  5. reinicia (ou inicia) o processo PM2 da aplicação
"""
import os
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

try:
    import paramiko
except ImportError:
    print("Dependência ausente: paramiko")
    print("Instale com: pip install paramiko")
    sys.exit(1)


def load_dotenv(env_path: Path) -> None:
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def required_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"Variável de ambiente obrigatória ausente: {name}")
    return value


def remote_git_update_command(branch: str) -> str:
    """Busca do origin e alinha o branch local ao origin/<branch>."""
    return f"git fetch origin {branch} && git checkout -B {branch} origin/{branch}"


def remote_pm2_sync_command(app_name: str) -> str:
    """Reinicia o app se já estiver no PM2; caso contrário, inicia-o."""
    return (
        f'if pm2 describe "{app_name}" >/dev/null 2>&1; then '
        f'pm2 restart "{app_name}" --update-env; '
        f'elif [ -f ecosystem.config.js ]; then '
        f'pm2 start ecosystem.config.js --only "{app_name}"; '
        f'else pm2 start npm --name "{app_name}" -- run start; fi && pm2 save'
    )


def remote_pm2_worker_sync_command(worker_name: str) -> str:
    """Reinicia o worker de campanhas (consumidor RabbitMQ) ou inicia-o."""
    return (
        f'if pm2 describe "{worker_name}" >/dev/null 2>&1; then '
        f'pm2 restart "{worker_name}" --update-env; '
        f'else pm2 start npm --name "{worker_name}" -- run worker; fi && pm2 save'
    )


def main() -> int:
    project_root = Path(__file__).resolve().parents[1]
    load_dotenv(project_root / ".env")

    host = required_env("VPS_HOST")
    password = required_env("VPS_PASSWORD")
    project_path = required_env("VPS_PROJECT_PATH")
    app_name = required_env("VPS_PM2_PROCESS_NAME")
    worker_name = os.environ.get("VPS_WORKER_PM2_PROCESS_NAME", "").strip() or f"{app_name}_worker"
    branch = os.environ.get("VPS_GIT_BRANCH", "main").strip() or "main"
    user = os.environ.get("VPS_USER", "root").strip() or "root"
    port = int(os.environ.get("VPS_PORT", "22"))

    remote_command = " && ".join(
        [
            f"cd {project_path}",
            remote_git_update_command(branch),
            "npm install",
            "npx prisma generate",
            "npm run build",
            remote_pm2_sync_command(app_name),
            remote_pm2_worker_sync_command(worker_name),
        ]
    )

    print(f"Conectando em {user}@{host}:{port} ...")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        client.connect(
            hostname=host,
            port=port,
            username=user,
            password=password,
            timeout=20,
            look_for_keys=False,
            allow_agent=False,
        )

        print("Executando passos de deploy no servidor...")
        stdin, stdout, stderr = client.exec_command(remote_command)
        _ = stdin

        out_text = stdout.read().decode("utf-8", errors="replace")
        err_text = stderr.read().decode("utf-8", errors="replace")
        exit_code = stdout.channel.recv_exit_status()

        if out_text.strip():
            print("\n--- STDOUT ---")
            print(out_text.rstrip())
        if err_text.strip():
            print("\n--- STDERR ---")
            print(err_text.rstrip())

        if exit_code != 0:
            print(f"\nDeploy falhou com código de saída {exit_code}")
            return exit_code

        print("\nDeploy concluído com sucesso.")
        return 0
    except Exception as exc:
        print(f"Erro no deploy: {exc}")
        return 1
    finally:
        client.close()


if __name__ == "__main__":
    raise SystemExit(main())
