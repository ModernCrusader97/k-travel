import { Component, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import './App.css'
import { LangProvider } from './LangContext'
import Header from './components/Header'
import Home from './pages/Home'
import CardApply from './pages/CardApply'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Complete from './pages/Complete'
import Guide from './pages/Guide'
import MyPage from './pages/MyPage'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(e: Error) { return { error: e.message } }
  render() {
    if (this.state.error) {
      return <div style={{ padding: 40, color: 'red', fontSize: 18 }}>
        <b>Error:</b> {this.state.error}
      </div>
    }
    return this.props.children
  }
}

function Layout() {
  return (
    <>
      <Header />
      <Outlet />
    </>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <LangProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="apply" element={<CardApply />} />
              <Route path="complete" element={<Complete />} />
              <Route path="guide" element={<Guide />} />
              <Route path="my" element={<MyPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </LangProvider>
    </ErrorBoundary>
  )
}
