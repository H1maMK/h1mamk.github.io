import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster, ToastBar, toast } from 'react-hot-toast'
import { useEffect } from 'react'


import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { FavoritesProvider } from './contexts/FavoritesContext'


import Header from './components/layout/Header'
import Footer from './components/layout/Footer'


import Home from './pages/Home'
import Catalog from './pages/Catalog'
import ProductPage from './pages/ProductPage'
import Cart from './pages/Cart'
import Profile from './pages/Profile'
import Orders from './pages/Orders'
import Favorites from './pages/Favorites'
import Login from './pages/Login'
import Register from './pages/Register'
import Articles from './pages/Articles'
import ArticlePage from './pages/ArticlePage'
import About from './pages/About'
import Policy from './pages/Policy'
import Vacancies from './pages/Vacancies'
import Support from './pages/Support'
import Privacy from './pages/Privacy'
import AdminPanel from './pages/admin/AdminPanel'


import './App.css'



const REVEAL_TYPES = new Map([
  ['.promo_sell', 'fade'],
  ['.category_text', 'fade'],
  ['.tovars_nedeli', 'fade'],
  ['.statii_text', 'fade'],
  ['.page-title', 'fade'],
  ['.favorites-page-title', 'fade'],
  ['.korzina-text', 'fade'],
  ['.category-content > *', 'scale-up'],
  ['.product-grid > *', 'scale-up'],
  ['.product-list-grid > *', 'scale-up'],
  ['.recommended-products-row > *', 'scale-up'],
  ['.statii-grid > *', 'scale-up'],
  ['.orders-table tbody tr', 'scale-up'],
  ['.reviews-container > *', 'scale-up'],
  ['.cart-list > *', 'scale-up'],
  ['.basket-container > *', 'scale-up'],
  ['.orders-card', 'scale-up'],
  ['.product-container', 'scale-up'],
  ['.details-section', 'scale-up'],
  ['.reviews-section', 'scale-up'],
  ['.profile-card', 'scale-up'],
  ['.auth-container', 'scale-up'],
])

const SCROLL_REVEAL_SELECTOR = Array.from(REVEAL_TYPES.keys()).join(', ')


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
})


function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}



function getRevealType(element) {
  for (const [selector, type] of REVEAL_TYPES) {
    try {
      if (element.matches(selector)) return type
    } catch {

    }
  }
  return 'scale-up'
}

function ScrollReveal() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const allElements = Array.from(document.querySelectorAll(SCROLL_REVEAL_SELECTOR)).filter(
      (el) => el instanceof HTMLElement && !el.closest('.admin-panel')
    )

    if (allElements.length === 0) return undefined


    allElements.forEach((el, index) => {
      const type = getRevealType(el)
      el.classList.add('scroll-reveal', `scroll-reveal--${type}`)


      el.style.setProperty('--reveal-delay', `${Math.min(index * 50, 450)}ms`)
    })

    if (prefersReducedMotion) {
      allElements.forEach((el) => el.classList.add('is-visible'))
      return () => {
        allElements.forEach((el) => {
          el.classList.remove('scroll-reveal', 'is-visible')
          el.style.removeProperty('--reveal-delay')
        })
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const el = entry.target
          if (el.classList.contains('is-visible')) continue
          el.classList.add('is-visible')
        }
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -2% 0px',
      }
    )

    const rafId = requestAnimationFrame(() => {
      allElements.forEach((el) => observer.observe(el))
    })

    return () => {
      cancelAnimationFrame(rafId)
      observer.disconnect()
      allElements.forEach((el) => {
        el.classList.remove('scroll-reveal', 'is-visible')
        el.style.removeProperty('--reveal-delay')
      })
    }
  }, [pathname])

  return null
}


function AppLayout() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="page-wrapper">
      <ScrollToTop />
      {!isAdminPage && <Header />}
      {!isAdminPage && <ScrollReveal />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/articles" element={<Articles />} />
        <Route path="/articles/:id" element={<ArticlePage />} />
        <Route path="/about" element={<About />} />
        <Route path="/policy" element={<Policy />} />
        <Route path="/vacancies" element={<Vacancies />} />
        <Route path="/support" element={<Support />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/admin/*" element={<AdminPanel />} />
      </Routes>
      {!isAdminPage && <Footer />}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            cursor: 'pointer',
          },
        }}
      >
        {(toastItem) => (
          <ToastBar
            toast={toastItem}
            style={{
              ...toastItem.style,
              cursor: 'pointer',
            }}
            onClick={() => toast.dismiss(toastItem.id)}
            title="Нажмите, чтобы закрыть уведомление"
          />
        )}
      </Toaster>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <CartProvider>
            <FavoritesProvider>
              <AppLayout />
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  )
}

export default App
