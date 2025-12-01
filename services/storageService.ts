// services/storageService.ts
import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export interface UploadedFile {
    id: string; // Will store the full storage path
    url: string;
    name: string;
    type: string;
    size: number;
}

export const uploadFile = async (file: File): Promise<UploadedFile> => {
    try {
        // Create a unique path: uploads/{timestamp}_{filename}
        const filePath = `uploads/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, filePath);

        // Upload
        const snapshot = await uploadBytes(storageRef, file);

        // Get URL
        const downloadURL = await getDownloadURL(snapshot.ref);

        return {
            id: filePath, // Store path as ID for easier deletion
            url: downloadURL,
            name: file.name,
            type: file.type,
            size: file.size
        };
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
};

export const deleteFile = async (filePath: string): Promise<void> => {
    try {
        const fileRef = ref(storage, filePath);
        await deleteObject(fileRef);
    } catch (error) {
        console.error("Error deleting file:", error);
        throw error;
    }
};
