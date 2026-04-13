import axios from "axios";

const API_URL = "http://localhost:8080/api/v2/records";

export const getRecords = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};