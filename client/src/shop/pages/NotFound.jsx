import { Link } from 'react-router-dom'
import { Empty } from '../components/parts'

export default function NotFound() {
  return <Empty title="Страница не найдена" text="Такого адреса нет." action={<Link className="btn btn-primary" to="/">В каталог</Link>} />
}
