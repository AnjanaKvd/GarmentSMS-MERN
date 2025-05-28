// Function to normalize IDs in API responses
export const normalizeId = (data) => {
  if (!data) return data;
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => normalizeId(item));
  }
  
  // Handle objects
  if (typeof data === 'object') {
    // If object has _id but no id, add id
    if (data._id && !data.id) {
      return { ...data, id: data._id };
    }
    return data;
  }
  
  return data;
};
