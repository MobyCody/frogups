import { ScrollView, StyleSheet, Text } from 'react-native';
// Passe den Pfad hier an den tatsächlichen Speicherort deiner constants-Datei an
import { colors } from '../constants/colors';

export default function PrivacyScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.date}>Effective Date: October 16, 2026</Text>

      <Text style={styles.heading}>1. Data Collection and Use</Text>
      <Text style={styles.paragraph}>
        FrogUps is designed to respect your privacy. The application operates entirely locally on your device. Moritz Brausch (the "Service Provider") does not collect, store, or transmit any personal data, health data, or analytics to external servers. All your training progress, plans, and achievements remain strictly on your own device.
      </Text>

      <Text style={styles.heading}>2. Third-Party Services</Text>
      <Text style={styles.paragraph}>
        The application does not use any third-party tracking, analytics, or advertising services that collect personal user data.
      </Text>

      <Text style={styles.heading}>3. Changes to This Privacy Policy</Text>
      <Text style={styles.paragraph}>
        We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
      </Text>

      <Text style={styles.heading}>4. Contact Us</Text>
      <Text style={styles.paragraph}>
        If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact the Service Provider at morbrau@gmx.de.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.screenBackground,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 5,
    color: colors.textPrimary,
  },
  date: {
    fontSize: 14,
    color: colors.textSubtle,
    marginBottom: 20,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
    color: colors.primaryDark,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textPrimary,
  },
});