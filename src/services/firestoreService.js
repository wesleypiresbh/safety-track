import { db } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc, count, aggregate, orderBy, limit } from 'firebase/firestore';

export const addClient = async (clientData) => {
  try {
    const docRef = await addDoc(collection(db, 'clientes'), clientData);
    return docRef.id;
  } catch (e) {
    console.error('Error adding document: ', e);
    throw e;
  }
};

export const getClientByCpfCnpj = async (cpfCnpj) => {
  try {
    const q = query(collection(db, 'clientes'), where('cpfCnpj', '==', cpfCnpj));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.length > 0;
  } catch (e) {
    console.error('Error getting client by CPF/CNPJ: ', e);
    throw e;
  }
};

export const addVehicle = async (vehicleData) => {
  try {
    const docRef = await addDoc(collection(db, 'veiculos'), vehicleData);
    return docRef.id;
  } catch (e) {
    console.error('Error adding vehicle: ', e);
    throw e;
  }
};

export const getVehicleByPlate = async (plate) => {
  try {
    const q = query(collection(db, 'veiculos'), where('placa', '==', plate));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.length > 0;
  } catch (e) {
    console.error('Error getting vehicle by plate: ', e);
    throw e;
  }
};

export const getClients = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'clientes'));
    const clients = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return clients;
  } catch (e) {
    console.error('Error getting clients: ', e);
    throw e;
  }
};

export const getClientById = async (id) => {
  try {
    const docRef = doc(db, 'clientes', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (e) {
    console.error('Error getting client by ID: ', e);
    throw e;
  }
};

export const getVehicleById = async (id) => {
  try {
    const docRef = doc(db, 'veiculos', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (e) {
    console.error('Error getting vehicle by ID: ', e);
    throw e;
  }
};

export const addService = async (serviceData) => {
  try {
    const docRef = await addDoc(collection(db, 'atendimentos'), serviceData);
    return docRef.id;
  } catch (e) {
    console.error('Error adding service: ', e);
    throw e;
  }
};

export const getServicesByVehicleId = async (vehicleId) => {
  try {
    const q = query(collection(db, 'atendimentos'), where('veiculoId', '==', vehicleId));
    const querySnapshot = await getDocs(q);
    const services = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return services;
  } catch (e) {
    console.error('Error getting services by vehicle ID: ', e);
    throw e;
  }
};

export const getVehicles = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'veiculos'));
    const vehicles = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return vehicles;
  } catch (e) {
    console.error('Error getting vehicles: ', e);
    throw e;
  }
};

export const addOS = async (osData) => {
  try {
    const docRef = await addDoc(collection(db, 'ordensDeServico'), {
      ...osData,
      status: 'Aberta', // Default status
      dataAbertura: new Date().toISOString(), // Current timestamp
    });
    return docRef.id;
  } catch (e) {
    console.error('Error adding OS: ', e);
    throw e;
  }
};

export const getOSById = async (id) => {
  try {
    const docRef = doc(db, 'ordensDeServico', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (e) {
    console.error('Error getting OS by ID: ', e);
    throw e;
  }
};

export const updateOSStatus = async (id, newStatus) => {
  try {
    const osRef = doc(db, 'ordensDeServico', id);
    await updateDoc(osRef, { status: newStatus });
  } catch (e) {
    console.error('Error updating OS status: ', e);
    throw e;
  }
};

export const updateOSCosts = async (id, custoPecas, custoMaoDeObra) => {
  try {
    const osRef = doc(db, 'ordensDeServico', id);
    const custoTotal = (custoPecas || 0) + (custoMaoDeObra || 0);
    await updateDoc(osRef, {
      custoPecas: custoPecas || 0,
      custoMaoDeObra: custoMaoDeObra || 0,
      custoTotal: custoTotal,
      dataConclusao: new Date().toISOString(), // Set conclusion date when costs are updated (implies finalization) - this might need adjustment based on actual status flow
    });
  } catch (e) {
    console.error('Error updating OS costs: ', e);
    throw e;
  }
};

export const getOS = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'ordensDeServico'));
    const ordensDeServico = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return ordensDeServico;
  } catch (e) {
    console.error('Error getting OS: ', e);
    throw e;
  }
};

// New functions for dashboard metrics
export const getTotalClients = async () => {
  try {
    const q = query(collection(db, 'clientes'));
    const snapshot = await getDocs(q); // Using getDocs for count
    return snapshot.size;
  } catch (e) {
    console.error('Error getting total clients: ', e);
    throw e;
  }
};

export const getTotalVehicles = async () => {
  try {
    const q = query(collection(db, 'veiculos'));
    const snapshot = await getDocs(q); // Using getDocs for count
    return snapshot.size;
  } catch (e) {
    console.error('Error getting total vehicles: ', e);
    throw e;
  }
};

export const getTotalOS = async () => {
  try {
    const q = query(collection(db, 'ordensDeServico'));
    const snapshot = await getDocs(q); // Using getDocs for count
    return snapshot.size;
  } catch (e) {
    console.error('Error getting total OS: ', e);
    throw e;
  }
};

export const getOSCountByStatus = async (status) => {
  try {
    const q = query(collection(db, 'ordensDeServico'), where('status', '==', status));
    const snapshot = await getDocs(q); // Using getDocs for count
    return snapshot.size;
  } catch (e) {
    console.error(`Error getting OS count for status ${status}: `, e);
    throw e;
  }
};

export const getRecentClients = async (limitCount = 5) => {
  try {
    const q = query(collection(db, 'clientes'), orderBy('nome'), limit(limitCount)); // Assuming 'nome' for ordering
    const querySnapshot = await getDocs(q);
    const clients = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return clients;
  } catch (e) {
    console.error('Error getting recent clients: ', e);
    throw e;
  }
};

export const getRecentVehicles = async (limitCount = 5) => {
  try {
    const q = query(collection(db, 'veiculos'), orderBy('placa'), limit(limitCount)); // Assuming 'placa' for ordering
    const querySnapshot = await getDocs(q);
    const vehicles = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return vehicles;
  } catch (e) {
    console.error('Error getting recent vehicles: ', e);
    throw e;
  }
};

export const getRecentOS = async (limitCount = 5) => {
  try {
    const q = query(collection(db, 'ordensDeServico'), orderBy('dataAbertura', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    const ordensDeServico = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return ordensDeServico;
  } catch (e) {
    console.error('Error getting recent OS: ', e);
    throw e;
  }
};