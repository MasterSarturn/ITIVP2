// Таблицы аудита в БД нет: действия администратора, влияющие на безопасность и деньги, пишем в лог
function audit(actor, action, details = {}) {
  console.log(JSON.stringify({ type: 'audit', at: new Date().toISOString(), actorId: actor.id, action, ...details }));
}

module.exports = audit;
