const PAGE_SIZE = 20;

const ASC = [['createdAt', 'ASC'], ['id', 'ASC']];
const DESC = [['createdAt', 'DESC'], ['id', 'DESC']];

// UUID не упорядочены по времени, поэтому сортируем по createdAt, а id нужен для стабильности
async function paginate(model, page, options = {}) {
  const { rows, count } = await model.findAndCountAll({
    order: ASC,
    ...options,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE
  });

  return toPage(rows, count, page);
}

function toPage(items, totalItems, page) {
  return {
    items,
    page,
    pageSize: PAGE_SIZE,
    totalItems,
    totalPages: Math.ceil(totalItems / PAGE_SIZE)
  };
}

module.exports = { PAGE_SIZE, ASC, DESC, paginate, toPage };
