import {
  FIXED_ITEM_EXPIRING_SOON_DAYS,
  FixedItemLifecycleStatus,
} from '../constants/fixed-item.constants';

interface FixedItemVigency {
  active: boolean;
  startsOn: Date;
  endsOn: Date;
}

export interface FixedItemLifecycleMeta {
  lifecycleStatus: FixedItemLifecycleStatus;
  daysUntilEnd: number;
  renewalEligible: boolean;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysBetween(from: Date, to: Date): number {
  const ms = startOfDay(to).getTime() - startOfDay(from).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function computeFixedItemLifecycle(
  item: FixedItemVigency,
  referenceDate: Date = new Date(),
): FixedItemLifecycleMeta {
  const today = startOfDay(referenceDate);
  const startsOn = startOfDay(item.startsOn);
  const endsOn = startOfDay(item.endsOn);
  const daysUntilEnd = daysBetween(today, endsOn);

  if (!item.active) {
    return {
      lifecycleStatus: FixedItemLifecycleStatus.INACTIVE,
      daysUntilEnd,
      renewalEligible: false,
    };
  }

  if (today > endsOn) {
    return {
      lifecycleStatus: FixedItemLifecycleStatus.EXPIRED,
      daysUntilEnd,
      renewalEligible: true,
    };
  }

  if (daysUntilEnd <= FIXED_ITEM_EXPIRING_SOON_DAYS) {
    return {
      lifecycleStatus: FixedItemLifecycleStatus.EXPIRING_SOON,
      daysUntilEnd,
      renewalEligible: true,
    };
  }

  if (today < startsOn) {
    return {
      lifecycleStatus: FixedItemLifecycleStatus.SCHEDULED,
      daysUntilEnd,
      renewalEligible: false,
    };
  }

  return {
    lifecycleStatus: FixedItemLifecycleStatus.ACTIVE,
    daysUntilEnd,
    renewalEligible: false,
  };
}
