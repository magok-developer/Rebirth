const { Router } = require('express');
const itemService = require('../services/ItemService');
const { authenticateAdmin } = require('../middlewares/authUserMiddlewares');
const { upload } = require('../middlewares/s3Middleware');
const { BadRequestError } = require('../common/BadRequestError');
const formidable = require('formidable');

const itemsRouter = Router();

// GET /api/v1/items - 모든 아이템 조회 ( ALL , Pagination 구현 x )
itemsRouter.get('/', async (req, res, next) => {
  try {
    const items = await itemService.getItems();

    res.status(200).json(items);
  } catch (err) {
    next(err);
  }
});

// 관리자
// 상품 추가, POST /api/v1/items
itemsRouter.post(
  '/',
  authenticateAdmin,
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'detail_image[]' }]),
  async (req, res, next) => {
    const { category, name, price, option, content } = req.body;
    const { detailCount } = req.query;
    const image = req.files.image[0];
    const detailImages = req.files['detail_image[]'];
    const parsedOption = JSON.parse(option);

    try {
      if (!image) {
        throw new BadRequestError('이미지가 존재하지 않습니다.');
      }
      if (image.length > detailCount) {
        throw new BadRequestError('이미지의 수가 너무 많습니다.');
      }

      const newItem = await itemService.addItem(category, name, price, parsedOption, content, image, detailImages);
      res.status(201).json({ message: '아이템이 성공적으로 추가되었습니다.', item: newItem });
    } catch (err) {
      next(err);
    }
  },
);

// 관리자
// 상품 삭제, DELETE /api/v1/items/delete 여러개
itemsRouter.delete('/', authenticateAdmin, async (req, res, next) => {
  const { itemIds } = req.body;
  try {
    const deletedItems = await itemService.deleteItems(itemIds);
    if (!deletedItems) {
      res.status(404).json({ message: '해당 아이템을 찾을 수 없습니다.' });
    }
    res.status(200).json({ message: '아이템이 삭제되었습니다.', item: deletedItems });
  } catch (err) {
    next(err);
  }
});

// 상품 수정, PUT /api/v1/items/:id
itemsRouter.put(
  '/:id',
  authenticateAdmin,
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'detail_image[]' }]),
  async (req, res, next) => {
    const { category, name, price, option, content } = req.body;
    const { detailCount } = req.query;
    const { id } = req.params;
    const image = req.files.image[0];
    const detailImages = req.files['detail_image[]'];
    const parsedOption = JSON.parse(option);

    try {
      if (!image) {
        throw new BadRequestError('이미지가 존재하지 않습니다.');
      }
      if (image.length > detailCount) {
        throw new BadRequestError('이미지의 수가 너무 많습니다.');
      }

      const updatedItem = await itemService.updateItem(
        id,
        category,
        name,
        price,
        parsedOption,
        content,
        image,
        detailImages,
      );

      if (!updatedItem) {
        res.status(404).json({ message: '해당 아이템을 찾을 수 없습니다.' });
      }
      res.status(200).json({
        message: '아이템이 성공적으로 수정되었습니다.',
        item: updatedItem,
      });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/v1/items/:categoryName/:page/:limit - categoryName에 해당하는 아이템 반환
itemsRouter.get('/:categoryName/:page/:limit', async (req, res, next) => {
  const { categoryName, page = 1, limit = 20 } = req.params;
  try {
    const itemsInCategory = await itemService.getitemsByCategory(categoryName, page, limit);
    res.status(200).json(itemsInCategory);
  } catch (err) {
    next(err);
  }
});

// pagination : default : 20 items
// GET /api/v1/items/:page/:limit
itemsRouter.get('/:page/:limit', async (req, res, next) => {
  const { page = 1, limit = 20 } = req.params;
  try {
    const Allitems = await itemService.getItemsByPage(page, limit);
    res.status(200).json(Allitems);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/items/:id - 특정 아이템 조회
itemsRouter.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const item = await itemService.getItemById(id);

    if (!item) {
      res.status(404).json({
        message: '해당 아이템을 찾을 수 없습니다.',
      });
    } else {
      res.status(200).json(item);
    }
  } catch (err) {
    next(err);
  }
});

module.exports = itemsRouter;
