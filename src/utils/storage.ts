import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { v4 as uuidv4 } from 'uuid';

export const uploadFile = async (file: File | Blob, folder: string = 'chat-media'): Promise<string> => {
  const fileId = uuidv4();
  const fileExtension = file instanceof File ? file.name.split('.').pop() : 'png';
  const fileName = `${fileId}.${fileExtension}`;
  const storageRef = ref(storage, `${folder}/${fileName}`);
  
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  return downloadURL;
};

export const dataURLtoBlob = (dataurl: string): Blob => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};
