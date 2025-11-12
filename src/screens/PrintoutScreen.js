import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import BackButton from '../../components/BackButton';

export default function PrintoutScreen({ route }) {
  const { contract } = route.params;

  const htmlContent = `
    <html>
      <body>
        <h1>Contract</h1>
        <p><strong>Title:</strong> ${contract.title}</p>
        <p><strong>Description:</strong> ${contract.description}</p>
        <p><strong>Amount:</strong> ${contract.amount}</p>
        <p><strong>Status:</strong> ${contract.status}</p>
        <p><strong>Originator:</strong> ${contract.originator?.name} (${contract.originator?.email})<br/>UUID: ${contract.originator?.uuid}<br/>Role: ${contract.originator?.role}</p>
        <p><strong>Recipient:</strong> ${contract.recipient?.name} (${contract.recipient?.email})<br/>UUID: ${contract.recipient?.uuid}<br/>Role: ${contract.signatures?.find(s => s.email === contract.recipient?.email)?.role || 'Not specified'}</p>
        <p><strong>Clauses:</strong><br/>${contract.clauses?.map(c => `• ${c}`).join('<br/>')}</p>
        <p><strong>Dispute Clause:</strong> ${contract.disputeClause}</p>
        <p><strong>Deadline:</strong> ${contract.deadline}</p>
        <h2>Signatures</h2>
        ${contract.signatures?.map(sig => `
          <p>
            Name: ${sig.name}<br/>
            Email: ${sig.email}<br/>
            Role: ${sig.role}<br/>
            Signature: ${sig.signature}<br/>
            Date: ${new Date(sig.date).toLocaleString()}<br/>
          </p>
        `).join('')}
      </body>
    </html>
  `;

  const handlePrint = async () => {
    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      if (Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Printout saved', 'File saved to: ' + uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to print or save: ' + error.message);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <BackButton />
        <Text style={styles.title}>Contract Printout Preview</Text>
        <Text style={styles.label}>Title: <Text style={styles.value}>{contract.title}</Text></Text>
        <Text style={styles.label}>Amount: <Text style={styles.value}>{contract.amount}</Text></Text>
        <Text style={styles.label}>Description: <Text style={styles.value}>{contract.description}</Text></Text>
        <Text style={styles.label}>Inspection Requirements: <Text style={styles.value}>{contract.inspectionRequirements}</Text></Text>
        <Text style={styles.label}>Penalties: <Text style={styles.value}>{contract.penalties}</Text></Text>
        <Text style={styles.label}>Milestones: <Text style={styles.value}>{contract.milestones}</Text></Text>
        <Text style={styles.label}>Status: <Text style={styles.value}>{contract.status}</Text></Text>
        <Text style={styles.label}>Originator: <Text style={styles.value}>{contract.originator?.name} ({contract.originator?.email})</Text></Text>
        <Text style={styles.label}>Originator UUID: <Text style={styles.value}>{contract.originator?.uuid}</Text></Text>
        <Text style={styles.label}>Originator Role: <Text style={styles.value}>{contract.originator?.role}</Text></Text>
        <Text style={styles.label}>Recipient: <Text style={styles.value}>{contract.recipient?.name} ({contract.recipient?.email})</Text></Text>
        <Text style={styles.label}>Recipient UUID: <Text style={styles.value}>{contract.recipient?.uuid}</Text></Text>
        <Text style={styles.label}>Recipient Role: <Text style={styles.value}>{contract.signatures?.find(s => s.email === contract.recipient?.email)?.role || 'Not specified'}</Text></Text>
        <Text style={styles.label}>Clauses:</Text>
        {contract.clauses?.map((clause, idx) => (
          <Text key={idx} style={{ marginLeft: 10 }}>{`• ${clause}`}</Text>
        ))}
        <Text style={styles.label}>Dispute Clause: <Text style={styles.value}>{contract.disputeClause}</Text></Text>
        <Text style={styles.label}>Deadline: <Text style={styles.value}>{contract.deadline}</Text></Text>
        <Text style={{ fontWeight: 'bold', marginTop: 16 }}>Signatures:</Text>
        {contract.signatures?.map((sig, idx) => (
          <View key={idx} style={{ marginLeft: 10, marginBottom: 8 }}>
            <Text>Name: {sig.name}</Text>
            <Text>Email: {sig.email}</Text>
            <Text>Role: {sig.role}</Text>
            <Text>Signature: {sig.signature}</Text>
            <Text>Date: {new Date(sig.date).toLocaleString()}</Text>
          </View>
        ))}
        <View style={{ marginVertical: 24 }}>
          <Button title="Print / Save as PDF or Word" onPress={handlePrint} color="#4B7BEC" />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  label: { fontSize: 16, fontWeight: '600', marginTop: 8 },
  value: { fontWeight: '400' },
});
