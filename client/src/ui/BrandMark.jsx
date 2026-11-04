import logo from '../assets/brand-logo.png'

// Знак магазина вместо прежней буквы «Ц»
export default function BrandMark({ style }) {
  return <img className="brand-mark" src={logo} alt="" width="30" height="30" style={style} />
}
