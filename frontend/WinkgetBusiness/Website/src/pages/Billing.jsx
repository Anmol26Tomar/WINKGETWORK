import React from 'react'
import { useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import BillingForm from '../components/BillingForm.jsx'

export default function Billing() {
  const { state } = useApp()
  const location = useLocation()
  const initial = location.state?.initial

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Billing</h1>
      <BillingForm products={state.products} initial={initial} onPrint={() => {}} />
    </div>
  )
}


