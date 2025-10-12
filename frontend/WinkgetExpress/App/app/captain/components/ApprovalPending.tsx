import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, Mail, Phone, MapPin, Car, CheckCircle } from 'lucide-react-native';

interface ApprovalPendingProps {
  agent: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    city: string;
    vehicleType: string;
    serviceType: string;
    vehicleSubType?: string;
    approved: boolean;
  };
  onLogout: () => void;
}

export const ApprovalPending: React.FC<ApprovalPendingProps> = ({ agent, onLogout }) => {
  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType.toLowerCase()) {
      case 'bike': return '🏍️';
      case 'cab': return '🚗';
      case 'truck': return '🚛';
      default: return '🚗';
    }
  };

  const getStatusColor = () => {
    return { bg: '#FEF3C7', text: '#D97706', icon: '⏳' };
  };

  const status = getStatusColor();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={styles.statusIcon}>{status.icon}</Text>
          <Text style={[styles.statusText, { color: status.text }]}>
            Pending Approval
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome, {agent.fullName}! 👋</Text>
          <Text style={styles.subText}>
            Your application is under review by our admin team.
          </Text>
        </View>


        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Your Application Details</Text>
          
          <View style={styles.detailRow}>
            <Mail size={20} color="#6B7280" />
            <Text style={styles.detailText}>{agent.email}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Phone size={20} color="#6B7280" />
            <Text style={styles.detailText}>{agent.phone}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <MapPin size={20} color="#6B7280" />
            <Text style={styles.detailText}>{agent.city}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Car size={20} color="#6B7280" />
            <Text style={styles.detailText}>
              {getVehicleIcon(agent.vehicleType)} {agent.vehicleType.toUpperCase()}
              {agent.vehicleSubType && ` - ${agent.vehicleSubType}`}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <CheckCircle size={20} color="#6B7280" />
            <Text style={styles.detailText}>
              {agent.serviceType.replace('-', ' ').toUpperCase()} Service
            </Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>
            What Happens Next?
          </Text>
          <Text style={styles.infoText}>
            Our admin team will review your application within 24-48 hours. You will receive an email notification once your account is approved.
          </Text>
        </View>

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Need Help?</Text>
          <Text style={styles.contactText}>
            Contact our support team at support@winkget.com or call +91-XXXX-XXXX
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subText: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  rejectionSection: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  rejectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 8,
  },
  rejectionText: {
    fontSize: 14,
    color: '#7F1D1D',
    lineHeight: 20,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  infoSection: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1E3A8A',
    lineHeight: 20,
  },
  contactSection: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#15803D',
    lineHeight: 20,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
