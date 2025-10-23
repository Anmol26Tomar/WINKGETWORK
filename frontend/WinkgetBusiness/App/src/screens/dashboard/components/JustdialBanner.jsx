import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const JustdialBanner = ({ onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={0.8}
      onPress={onPress}
    >
      <LinearGradient
        colors={['#E0F2FE', '#F0F9FF']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.textSection}>
            <Text style={styles.connectText}>Connect with</Text>
            <View style={styles.mainTextContainer}>
              <Text style={styles.mainNumber}>19.1 Crore+</Text>
              <Text style={styles.mainText}>Customers</Text>
            </View>
            <Text style={styles.platformText}>on Winkget</Text>
            
            <TouchableOpacity style={styles.ctaButton}>
              <Text style={styles.ctaText}>List your business for </Text>
              <View style={styles.freeBadge}>
                <Text style={styles.freeText}>FREE</Text>
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.visualSection}>
            <View style={styles.businessmanContainer}>
              <View style={styles.businessman}>
                <Ionicons name="person" size={40} color="#1E40AF" />
              </View>
              
              {/* Floating chart elements */}
              <View style={[styles.chartElement, styles.barChart]}>
                <View style={styles.bar1} />
                <View style={styles.bar2} />
                <View style={styles.bar3} />
                <Text style={styles.chartText}>%</Text>
              </View>
              
              <View style={[styles.chartElement, styles.pieChart]}>
                <View style={styles.pieSlice1} />
                <View style={styles.pieSlice2} />
                <View style={styles.pieSlice3} />
              </View>
              
              <View style={[styles.chartElement, styles.lineChart]}>
                <View style={styles.line} />
                <View style={styles.lineDot1} />
                <View style={styles.lineDot2} />
                <View style={styles.lineDot3} />
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  gradient: {
    padding: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textSection: {
    flex: 1,
    paddingRight: 16,
  },
  connectText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  mainTextContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  mainNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginRight: 8,
  },
  mainText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  platformText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  ctaText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  freeBadge: {
    backgroundColor: '#EC4899',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  freeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  visualSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessmanContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessman: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1E40AF',
  },
  chartElement: {
    position: 'absolute',
  },
  barChart: {
    top: -10,
    right: -20,
    width: 20,
    height: 20,
    backgroundColor: '#10B981',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar1: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    width: 3,
    height: 8,
    backgroundColor: 'white',
  },
  bar2: {
    position: 'absolute',
    bottom: 2,
    left: 6,
    width: 3,
    height: 12,
    backgroundColor: 'white',
  },
  bar3: {
    position: 'absolute',
    bottom: 2,
    left: 10,
    width: 3,
    height: 6,
    backgroundColor: 'white',
  },
  chartText: {
    fontSize: 8,
    color: 'white',
    fontWeight: 'bold',
  },
  pieChart: {
    top: 10,
    left: -25,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  pieSlice1: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    transform: [{ rotate: '0deg' }],
  },
  pieSlice2: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    transform: [{ rotate: '120deg' }],
  },
  pieSlice3: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    transform: [{ rotate: '240deg' }],
  },
  lineChart: {
    bottom: -15,
    right: -15,
    width: 24,
    height: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    position: 'absolute',
    width: 16,
    height: 2,
    backgroundColor: 'white',
    borderRadius: 1,
  },
  lineDot1: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'white',
    left: 2,
    top: 4,
  },
  lineDot2: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'white',
    left: 8,
    top: 2,
  },
  lineDot3: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'white',
    left: 14,
    top: 6,
  },
});

export default JustdialBanner;
