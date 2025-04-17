import { Platform } from 'react-native';
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__
    ? Platform.OS === 'android'
      ? 'http://10.0.2.2:3000/api' // Android Emulator
      : 'http://localhost:3000/api' // iOS Simulator
    : 'https://handwash-backend.onrender.com/api'); // เปลี่ยนตอน deploy จริง

export const submitHandwashingData = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return await response.json();
  } catch (error) {
    console.error('Error submitting handwashing data:', error);
    throw new Error('ไม่สามารถส่งข้อมูลได้');
  }
};

export const fetchHandwashingStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/stats`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching handwashing stats:', error);
    throw new Error('ไม่สามารถดึงข้อมูลสถิติได้');
  }
};
