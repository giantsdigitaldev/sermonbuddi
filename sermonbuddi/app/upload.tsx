import PageContainer from '@/components/PageContainer';
import { Text, View } from 'react-native';

export default function UploadSermonScreen() {
  return (
    <PageContainer>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
        Upload Sermon
      </Text>
      <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <Text>Upload sermon document functionality will appear here.</Text>
      </View>
    </PageContainer>
  );
} 