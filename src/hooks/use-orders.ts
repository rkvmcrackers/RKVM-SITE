import { useState, useEffect } from 'react';
import { saveOrders, getOrders } from '../utils/github-api';

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  customerNotes?: string;
  orderItems: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  orderTotal: number;
  orderDate: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
}

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load orders from GitHub
  const loadOrders = async () => {
    try {
      setLoading(true);
      const fetchedOrders = await getOrders();
      setOrders(fetchedOrders);
      setError(null);
    } catch (err) {
      setError('Failed to load orders');
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add new order
  const addOrder = async (order: Omit<Order, 'id' | 'orderDate' | 'status'>) => {
    try {
      const newOrder: Order = {
        ...order,
        id: Date.now().toString(),
        orderDate: new Date().toISOString(),
        status: 'pending'
      };

      const updatedOrders = [...orders, newOrder];
      setOrders(updatedOrders);

      // Save to GitHub
      const success = await saveOrders(updatedOrders);
      if (!success) {
        setError('Failed to save order to GitHub');
        // Revert local state if GitHub save failed
        setOrders(orders);
        return false;
      }

      return true;
    } catch (err) {
      setError('Failed to add order');
      console.error('Error adding order:', err);
      return false;
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const updatedOrders = orders.map(order =>
        order.id === orderId ? { ...order, status } : order
      );
      setOrders(updatedOrders);

      // Save to GitHub
      const success = await saveOrders(updatedOrders);
      if (!success) {
        setError('Failed to update order in GitHub');
        // Revert local state if GitHub save failed
        setOrders(orders);
        return false;
      }

      return true;
    } catch (err) {
      setError('Failed to update order status');
      console.error('Error updating order status:', err);
      return false;
    }
  };

  // Delete order
  const deleteOrder = async (orderId: string) => {
    try {
      const updatedOrders = orders.filter(order => order.id !== orderId);
      setOrders(updatedOrders);

      // Save to GitHub
      const success = await saveOrders(updatedOrders);
      if (!success) {
        setError('Failed to delete order from GitHub');
        // Revert local state if GitHub save failed
        setOrders(orders);
        return false;
      }

      return true;
    } catch (err) {
      setError('Failed to delete order');
      console.error('Error deleting order:', err);
      return false;
    }
  };

  // Get orders by status
  const getOrdersByStatus = (status: Order['status']) => {
    return orders.filter(order => order.status === status);
  };

  // Get total revenue (excluding cancelled orders)
  const getTotalRevenue = () => {
    return orders.reduce((total, order) => {
      // Only include orders that are not cancelled
      if (order.status !== 'cancelled') {
        return total + order.orderTotal;
      }
      return total;
    }, 0);
  };

  // Get total revenue including all orders (for reference)
  const getTotalRevenueIncludingCancelled = () => {
    return orders.reduce((total, order) => total + order.orderTotal, 0);
  };

  // Get total amount of cancelled orders
  const getCancelledOrdersAmount = () => {
    return orders.reduce((total, order) => {
      if (order.status === 'cancelled') {
        return total + order.orderTotal;
      }
      return total;
    }, 0);
  };

  // Get orders count by status
  const getOrdersCountByStatus = () => {
    const counts = {
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };

    orders.forEach(order => {
      counts[order.status]++;
    });

    return counts;
  };

  // Load orders on mount
  useEffect(() => {
    loadOrders();
  }, []);

  return {
    orders,
    loading,
    error,
    addOrder,
    updateOrderStatus,
    deleteOrder,
    getOrdersByStatus,
    getTotalRevenue,
    getTotalRevenueIncludingCancelled,
    getCancelledOrdersAmount,
    getOrdersCountByStatus,
    loadOrders
  };
};
