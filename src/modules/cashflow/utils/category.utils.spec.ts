import { mergeDistinctCategories } from './category.utils';

describe('mergeDistinctCategories', () => {
  it('removes duplicates case-insensitively and sorts in pt-BR', () => {
    expect(
      mergeDistinctCategories([
        'Infraestrutura',
        'infraestrutura',
        'Receita de projeto',
        '  Folha de pagamento  ',
        null,
        '',
      ]),
    ).toEqual(['Folha de pagamento', 'Infraestrutura', 'Receita de projeto']);
  });
});
