import AsyncStorage from '@react-native-async-storage/async-storage';

// Save an item (contracts or disputes)
export const saveItem = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error saving item', e);
  }
};

// Get items
export const getItem = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error reading item', e);
    return [];
  }
};

// Add a new item to existing list
export const addItem = async (key, newItem) => {
  const existingItems = await getItem(key);
  const updatedItems = [newItem, ...existingItems];
  await saveItem(key, updatedItems);
};
