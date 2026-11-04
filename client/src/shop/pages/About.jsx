import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BRAND } from '../../brand'
import BrandMark from '../../ui/BrandMark'
import Icon from '../../ui/Icon'

const FACTS = [
  ['2025', 'год основания'],
  ['Минск', 'наш город'],
  ['Беларусь', 'наша страна'],
  ['BYN', 'цены в белорусских рублях'],
]

const PRINCIPLES = [
  ['shield', 'Надёжность', 'Мы стремимся предлагать качественные цифровые товары и обеспечивать прозрачность покупок.'],
  ['zap', 'Удобство', 'Делаем процесс заказа простым, понятным и доступным.'],
  ['support', 'Поддержка', 'Мы ценим каждого клиента и готовы помочь разобраться с возникающими вопросами.'],
]

export default function About() {
  useEffect(() => {
    document.title = `О нас — ${BRAND}`
    return () => { document.title = BRAND }
  }, [])

  return (
    <article className="about">
      <header className="about-hero">
        <span className="about-logo"><BrandMark /></span>
        <div className="about-hero-text">
          <span className="about-eyebrow">О нас</span>
          <h1>{BRAND}</h1>
          <p className="about-lead">Цифровые возможности — ближе, чем кажется</p>
          <p className="about-tagline">
            Белорусский магазин цифровых товаров, созданный в 2025 году в городе Минске.
          </p>
        </div>
      </header>

      <dl className="about-facts">
        {FACTS.map(([value, label]) => (
          <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
        ))}
      </dl>

      <section className="about-section about-split">
        <h2>Наша история</h2>
        <div className="about-text">
          <p>
            Наша история началась с простой идеи: сделать мир цифровых возможностей доступнее для каждого. Мы верим, что современные
            технологии должны упрощать жизнь, открывать новые перспективы и помогать людям достигать своих целей.
          </p>
          <p>
            Именно поэтому в 2025 году появился {BRAND} — проект, объединивший стремление к качеству, удобству и современному подходу
            к онлайн-покупкам.
          </p>
          <p>
            Мы понимаем, насколько важны для покупателей надёжность, скорость и комфорт. Поэтому стремимся сделать каждую покупку
            максимально простой и понятной: от выбора цифрового товара до получения заказа.
          </p>
        </div>
      </section>

      <section className="about-section">
        <div className="about-section-head">
          <h2>Наша философия</h2>
          <p>
            Мы не просто продаём цифровые товары. Мы создаём пространство, в котором каждый покупатель может найти подходящее решение
            для своих задач. В основе нашей работы лежат три принципа.
          </p>
        </div>
        <ul className="principles">
          {PRINCIPLES.map(([icon, title, text], index) => (
            <li key={title} className="card">
              <span className="principle-icon"><Icon name={icon} /></span>
              <span className="principle-num">0{index + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="about-section about-split">
        <h2>Белорусский проект с большими планами</h2>
        <div className="about-text">
          <p>
            {BRAND} родился в Минске, но наши амбиции не ограничиваются одним городом. Мы хотим развивать магазин, расширять
            ассортимент и становиться ещё удобнее для покупателей.
          </p>
          <p>
            Для нас важно не просто соответствовать ожиданиям, но и постоянно совершенствоваться, следить за развитием цифрового
            рынка и предлагать актуальные решения.
          </p>
          <blockquote>
            Мы только начинаем свой путь, но уже сегодня уверены: будущее принадлежит тем, кто умеет использовать возможности
            технологий.
          </blockquote>
        </div>
      </section>

      <section className="about-cta card">
        <div>
          <strong>{BRAND} — цифровые товары. Современные решения. Удобные покупки.</strong>
          <p className="muted">Будем рады видеть вас среди наших покупателей! Спасибо, что выбираете {BRAND}.</p>
        </div>
        <Link className="btn btn-primary" to="/"><Icon name="store" />Перейти в магазин</Link>
      </section>
    </article>
  )
}
