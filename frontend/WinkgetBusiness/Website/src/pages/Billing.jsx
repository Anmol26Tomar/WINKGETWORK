import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import BillingForm from '../components/BillingForm.jsx'
import { getVendorBills, getBillStats, getBillById } from '../services/billService.js'
import { generateBillPDF } from '../utils/pdfGenerator.js'

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
      console.log('Loading bill stats...')
      const response = await getBillStats()
      console.log('Bill stats response:', response)
      
      if (response && response.stats) {
        console.log('Setting stats:', response.stats)
        setStats(response.stats)
      } else {
        console.log('No stats in response, using defaults')
        setStats({
          totalBills: 0,
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0
        })
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
      console.log('API call failed, this might be because no bills exist yet')
      // Set default stats if API fails
      setStats({
        totalBills: 0,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBillCreated = () => {
    loadBills()
    loadStats()
  }

  const handleDownloadPDF = async (billId) => {
    try {
      // First try to find the bill in the existing bills list
      const existingBill = bills.find(bill => bill._id === billId)
      
      if (existingBill) {
        console.log('Using existing bill data:', existingBill)
        generateBillPDF(existingBill)
        return
      }

      // If not found in list, try to fetch from API
      console.log('Attempting to fetch bill:', billId)
      const response = await getBillById(billId)
      console.log('Bill response:', response)
      
      if (response.success && response.bill) {
        generateBillPDF(response.bill)
      } else {
        console.error('Bill not found or invalid response:', response)
        alert('Bill not found or unable to generate PDF')
      }
    } catch (error) {
      console.error('Failed to download PDF:', error)
      alert('Failed to download PDF. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Billing Management</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              loadBills()
              loadStats()
            }}
            className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
            title="Refresh Data"
          >
            🔄 Refresh
          </button>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bills.map((bill) => (
                      <tr key={bill._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {bill.formattedBillNumber || bill.billNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{bill.customerName}</div>
                            {bill.customerEmail && (
                              <div className="text-gray-500 text-xs">{bill.customerEmail}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="font-medium">₹{bill.totalAmount?.toFixed(2) || '0.00'}</div>
                          {bill.paymentStatus && (
                            <div className={`text-xs ${
                              bill.paymentStatus === 'paid' ? 'text-green-600' :
                              bill.paymentStatus === 'pending' ? 'text-orange-600' :
                              'text-gray-500'
                            }`}>
                              {bill.paymentStatus}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            bill.status === 'paid' ? 'bg-green-100 text-green-800' :
                            bill.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                            bill.status === 'overdue' ? 'bg-red-100 text-red-800' :
                            bill.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {bill.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(bill.billDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleDownloadPDF(bill._id)}
                              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              📄 PDF
                            </button>
                            <button
                              onClick={() => handleDownloadPDF(bill._id)}
                              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              🖨️ Print
                            </button>
                          </div>
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


