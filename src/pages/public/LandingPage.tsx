import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'

export function LandingPage() {
  return (
    <div className="landing-container">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Define tu <span className="text-gradient">Estilo</span>,<br />
            Eleva tu <span className="text-gradient">Belleza</span>.
          </h1>
          <p className="hero-subtitle">
            Coloración, cortes y tratamientos capilares en un ambiente exclusivo.
            Tu mejor versión comienza aquí.
          </p>
          <div className="hero-actions">
            <Link to="/client/reservar">
              <Button size="lg" className="btn-glow">Reservar Cita</Button>
            </Link>
            <Link to="/login">
              <Button variant="ghost" size="lg">Iniciar Sesión</Button>
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <div className="image-placeholder"></div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="services-preview">
        <h2 className="section-title">Nuestros Servicios</h2>
        <div className="services-grid">
          <div className="service-card">
            <h3>Corte y Peinado</h3>
            <p>Corte personalizado con lavado y peinado profesional.</p>
            <span className="price">Desde 25€</span>
          </div>
          <div className="service-card highlight">
            <h3>Color y Mechas</h3>
            <p>Tintes, mechas balayage y tratamientos de color vibrante.</p>
            <span className="price">Desde 45€</span>
          </div>
          <div className="service-card">
            <h3>Tratamientos Capilares</h3>
            <p>Hidratación, keratina y reconstrucción profunda.</p>
            <span className="price">Desde 35€</span>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="info-section">
        <div className="info-block">
          <h3>Horario</h3>
          <p>Lunes - Viernes: 09:00 - 19:00</p>
          <p>Sábado: 09:00 - 14:00</p>
        </div>
        <div className="info-block">
          <h3>Ubicación</h3>
          <p>Calle Principal 123, Madrid</p>
          <p>+34 600 123 456</p>
        </div>
      </section>

      <style>{`
        .landing-container {
          width: 100%;
          overflow-x: hidden;
        }

        /* Hero */
        .hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4rem 2rem;
          min-height: 80vh;
          max-width: 1200px;
          margin: 0 auto;
          gap: 2rem;
        }

        .hero-content {
          flex: 1;
        }

        .hero-title {
          font-size: 3.5rem;
          line-height: 1.1;
          font-weight: 800;
          margin-bottom: 1.5rem;
          letter-spacing: -0.02em;
        }

        .text-gradient {
          background: linear-gradient(135deg, #6366F1 0%, #EC4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: var(--color-text-secondary);
          margin-bottom: 2.5rem;
          max-width: 500px;
          line-height: 1.6;
        }

        .hero-actions {
          display: flex;
          gap: 1rem;
        }

        .btn-glow {
          box-shadow: 0 4px 20px 0 rgba(99, 102, 241, 0.4);
        }

        .hero-image {
          flex: 1;
          display: flex;
          justify-content: center;
        }

        .image-placeholder {
          width: 400px;
          height: 500px;
          background: linear-gradient(45deg, #f3f4f6, #e5e7eb);
          border-radius: 2rem;
          position: relative;
          overflow: hidden;
        }
        
        .image-placeholder::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url('https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80');
          background-size: cover;
          background-position: center;
          opacity: 0.9;
        }

        /* Services */
        .services-preview {
          padding: 4rem 2rem;
          background-color: var(--color-bg-secondary);
        }

        .section-title {
          text-align: center;
          font-size: 2.5rem;
          margin-bottom: 3rem;
        }

        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .service-card {
          background: white;
          padding: 2rem;
          border-radius: 1rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          transition: transform 0.2s, box-shadow 0.2s;
          border: 1px solid transparent;
        }

        .service-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .service-card.highlight {
          border-color: #6366F1;
          position: relative;
          box-shadow: 0 8px 25px rgba(99, 102, 241, 0.2);
        }

        .service-card h3 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .service-card .price {
          display: block;
          margin-top: 1.5rem;
          font-weight: 700;
          font-size: 1.25rem;
          color: var(--color-primary);
        }

        /* Info */
        .info-section {
          padding: 4rem 2rem;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }

        .info-block h3 {
          margin-bottom: 1rem;
          font-size: 1.25rem;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .hero {
            flex-direction: column;
            text-align: center;
            padding-top: 2rem;
          }
          
          .hero-content {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          
          .hero-title {
            font-size: 2.5rem;
          }
          
          .image-placeholder {
            width: 100%;
            height: 300px;
          }
        }
      `}</style>
    </div>
  )
}
