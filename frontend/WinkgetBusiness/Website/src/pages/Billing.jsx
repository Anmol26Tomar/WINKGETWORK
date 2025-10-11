import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import BillingForm from '../components/BillingForm.jsx'
import { getVendorBills, getBillStats } from '../services/billService.js'

export default function Billing() {
  const { state } = useApp()
  const location = useLocation()
  const initial = location.state?.initial
  
  const [bills, setBills] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('create')

  useEffect(() => {
    loadBills()
    loadStats()
  }, [])

  const loadBills = async () => {
    try {
      const response = await getVendorBills({ limit: 10 })
      setBills(response.bills || [])
    } catch (error) {
      console.error('Failed to load bills:', error)
    }
  }

  const loadStats = async () => {
    try {
      const response = await getBillStats()
      setStats(response.stats)
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBillCreated = () => {
    loadBills()
    loadStats()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Billing Management</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'create' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Create Bill
          </button>
          <button
            onClick={() => setActiveTab('bills')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'bills' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            View Bills
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-500">Total Bills</h3>
            <p className="text-2xl font-bold">{stats.totalBills || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
            <p className="text-2xl font-bold">₹{stats.totalAmount || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-500">Paid Amount</h3>
            <p className="text-2xl font-bold text-green-600">₹{stats.paidAmount || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-500">Pending Amount</h3>
            <p className="text-2xl font-bold text-orange-600">₹{stats.pendingAmount || 0}</p>
          </div>
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === 'create' && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Create New Bill</h2>
          <BillingForm 
            products={state.products} 
            initial={initial} 
            onBillCreated={handleBillCreated}
            onPrint={() => {}} 
          />
        </div>
      )}

      {activeTab === 'bills' && (
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Recent Bills</h2>
          </div>
          <div className="overflow-x-auto">
              {bills.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No bills found. Create your first bill!
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bill #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bills.map((bill) => (
                      <tr key={bill._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {bill.formattedBillNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {bill.customerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{bill.totalAmount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            bill.status === 'paid' ? 'bg-green-100 text-green-800' :
                            bill.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                            bill.status === 'overdue' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {bill.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(bill.billDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
        </div>
      )}
    </div>
  )
}


