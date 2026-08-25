import Header from '../Header.jsx'
import Hero from '../sections/Hero.jsx'
import Services from '../sections/Services.jsx'
import About from '../sections/About.jsx'
import Results from '../sections/Results.jsx'
import Contact from '../sections/Contact.jsx'
import '../styles/landing.css'

export default function Landing() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Services />
        <About />
        <Results />
        <Contact />
      </main>
    </>
  )
}