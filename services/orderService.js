/* eslint-disable class-methods-use-this */
const { BadRequestError } = require('../common/BadRequestError');
const { NotFoundError } = require('../common/NotFoundError');
const { Address } = require('../models/Address');
const { Order } = require('../models/Order');

class OrderService {
  constructor() {
    this.ON_SHIPPING_LIST = ['배송중', '배송완료', '취소처리중', '주문취소'];
  }

  validateOnShipping(status) {
    if (this.ON_SHIPPING_LIST.includes(status))
      throw new BadRequestError(`이미 배송중인 제품은 변경 또는 취소할 수 없습니다.`);
  }

  async createOrder({ user, orderItems, address, totalPrice, status, message }) {
    const order = await Order.create({
      user,
      orderItems,
      address,
      totalPrice,
      status,
      message,
    });

    const createdOrder = await Order.find(order._id)
      .populate('user')
      .populate('address')
      .populate({
        path: 'orderItems',
        populate: {
          path: 'item',
        },
      });

    return createdOrder;
  }

  async getPagination(page, limit) {
    const orders = await Order.find()
      .populate('user')
      .populate('address')
      .populate({
        path: 'orderItems',
        populate: {
          path: 'item',
        },
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const count = await Order.countDocuments();

    return { orders, count };
  }

  async getOrderById(id) {
    const order = await Order.findById(id)
      .populate('user')
      .populate({
        path: 'orderItems',
        populate: {
          path: 'item',
        },
      })
      .populate('address');

    if (!order) {
      throw new NotFoundError('해당 주문을 찾을 수 없습니다.');
    }

    return order;
  }

  async getOrdersByStatus(userId, status, page, limit) {
    const orders = await Order.find({ status })
      .populate({ path: 'user', match: { _id: userId } })
      .populate({
        path: 'orderItems',
        populate: {
          path: 'item',
        },
      })
      .populate('address')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    if (!orders) {
      throw new NotFoundError('해당 주문을 찾을 수 없습니다.');
    }

    const count = await Order.countDocuments({ status });

    return { orders, count };
  }

  async getOrderByGuest(orderId) {
    const order = await Order.findOne({ _id: orderId })
      .populate({
        path: 'orderItems',
        populate: {
          path: 'item',
        },
      })
      .populate('address');

    if (!order) {
      throw new NotFoundError('해당 주문을 찾을 수 없습니다.');
    }

    return order;
  }

  async getPaginationByUser({ user, page, limit }) {
    const orders = await Order.find(user)
      .populate('user')
      .populate({
        path: 'orderItems',
        populate: {
          path: 'item',
        },
      })
      .populate('address')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const count = await Order.countDocuments({ user });

    return { orders, count };
  }

  async updateOrder(id, message, address, status, newOrderItems, totalPrice) {
    const order = await Order.findById(id);
    if (!order) {
      throw new NotFoundError('해당 주문을 찾을 수 없습니다.');
    }

    this.validateOnShipping(order.status);

    const newAddress = await Address.findByIdAndUpdate(order.address._id, { ...address }, { new: true });
    const updateOrderData = { message, address: newAddress, status, orderItems: newOrderItems, totalPrice };

    const updatedOrder = await Order.findByIdAndUpdate(id, updateOrderData, { new: true })
      .populate('user')
      .populate({
        path: 'orderItems',
        populate: {
          path: 'item',
        },
      })
      .populate('address');

    return updatedOrder;
  }

  async updateStatuses(orderIds, status) {
    const updatedOrder = await Order.updateMany({ _id: orderIds }, { status }, { new: true })
      .populate('user')
      .populate({
        path: 'orderItems',
        populate: {
          path: 'item',
        },
      })
      .populate('address');

    return updatedOrder;
  }

  async deleteOrders(orderIds) {
    const order = await Order.find({ _id: orderIds });

    if (!order) {
      throw new NotFoundError('해당 주문을 찾을 수 없습니다.');
    }

    this.validateOnShipping(order.status);

    await Order.deleteMany({ _id: orderIds });
  }
}

module.exports = new OrderService();
