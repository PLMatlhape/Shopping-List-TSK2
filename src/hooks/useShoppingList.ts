// Custom hook for shopping list management
import { useState, useEffect } from 'react';
import type { 
  ShoppingItem, 
  ShoppingList, 
  Category,
  CreateShoppingItemDto,
  UpdateShoppingItemDto
} from '../types/shopping';
import { shoppingListService } from '../services/shoppingListService';

export const useShoppingList = (userId: string, listId?: string) => {
  // Use user-specific key for localStorage
  const storageKey = userId ? `shoppingItems_${userId}` : 'shoppingItems';
  const [items, setItems] = useState<ShoppingItem[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch shopping items (from localStorage)
  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const stored = localStorage.getItem(storageKey);
      setItems(stored ? JSON.parse(stored) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  // Fetch shopping lists
  const fetchLists = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await shoppingListService.getShoppingLists(userId);
      setLists(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch lists');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const data = await shoppingListService.getCategories();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    }
  };

  // Add new item
  const addItem = async (itemData: CreateShoppingItemDto): Promise<ShoppingItem | null> => {
    try {
      setLoading(true);
      setError(null);
      const newItem: ShoppingItem = {
        ...itemData,
        id: Math.random().toString(36).substr(2, 9),
        listId: listId || '',
        isCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        priority: itemData.priority ?? 'medium',
      };
      setItems(prev => {
        const updated = [...prev, newItem];
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
      return newItem;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update item
  const updateItem = async (id: string, updates: UpdateShoppingItemDto): Promise<ShoppingItem | null> => {
    try {
      setLoading(true);
      setError(null);
      let updatedItem: ShoppingItem | null = null;
      setItems(prev => {
        const updated = prev.map(item => {
          if (item.id === id) {
            updatedItem = { ...item, ...updates, updatedAt: new Date().toISOString() };
            return updatedItem;
          }
          return item;
        });
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
      return updatedItem;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete item
  const deleteItem = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      setItems(prev => {
        const updated = prev.filter(item => item.id !== id);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Toggle item completion
  const toggleItem = async (id: string): Promise<ShoppingItem | null> => {
    try {
      setLoading(true);
      setError(null);
      let updatedItem: ShoppingItem | null = null;
      setItems(prev => {
        const updated = prev.map(item => {
          if (item.id === id) {
            updatedItem = { ...item, isCompleted: !item.isCompleted, updatedAt: new Date().toISOString() };
            return updatedItem;
          }
          return item;
        });
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
      return updatedItem;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle item');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create new shopping list
  const createList = async (name: string): Promise<ShoppingList | null> => {
    try {
      setLoading(true);
      setError(null);
      const newList = await shoppingListService.createShoppingList(userId, name);
      setLists(prev => [...prev, newList]);
      return newList;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create list');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Clear error
  const clearError = () => setError(null);

  // Computed values
  const completedItems = items.filter(item => item.isCompleted);
  const pendingItems = items.filter(item => !item.isCompleted);
  const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const completedValue = completedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Load data on mount
  useEffect(() => {
    fetchCategories();
    if (userId) {
      fetchLists();
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchItems();
    }
    // eslint-disable-next-line
  }, [userId]);

  return {
    // Data
    items,
    lists,
    categories,
    completedItems,
    pendingItems,
    
    // State
    loading,
    error,
    
    // Actions
    addItem,
    updateItem,
    deleteItem,
    toggleItem,
    createList,
    fetchItems,
    fetchLists,
    clearError,
    
    // Computed values
    totalValue,
    completedValue,
    completionPercentage: items.length > 0 ? (completedItems.length / items.length) * 100 : 0
  };
};
