import React from 'react';
import { X, Bell } from 'lucide-react';
import OffersAlertList from './OffersAlertList';
import { offers } from '../data/mockData';

const AlertsModal = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={18} />
            <h3>Alerts & Offers</h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <OffersAlertList items={offers} />
        </div>
      </div>
    </div>
  );
};

export default AlertsModal;




