const { Category } = require("../models/category");
const { Place } = require("../models/place");


exports.addCategory  = async (req, res, next) => {


    try {

        let category = await Category.findOne({ title: req.body.title });

        console.log(category);
        if (category) {
            return res.status(400).send({ message: "Category already exists!" });
        }

        const title = req.body.title;
    
        category = new Category({ title: title });

        await category.save();

        res.status(200).send(category);
    } catch (error) {
        next(error);
    }

};

exports.getCategories = async (req, res, next) => {
    let categories = [];


    try {
        categories = await Category.find();

        res.status(200).send({categories:categories});
    } catch (error) {
        next(error)
    }
}

exports.getCategoryById = async (req, res, next) => {
    const categoryId =  req.params.categoryId;
  
    try {
      const category = await Category.findById(categoryId);
  
      if(!category) {
         const error = new Error("There is not a category with this id!");
         error.statusCode = 401;
         throw error;
      }
  
      res.status(200).send(category);
  
    } catch(error) {
      next(error);
    }
  }

  exports.editCategory = async (req, res, next) => {
    const categoryId = req.params.categoryId;
  
    try {
      const category = await Category.findById(categoryId);
      if (!category) {
        const error = new Error("This category does not exist!");
        error.statusCode = 422;
        throw error;
      }
  
      const place = await Place.find({category:req.params.categoryId});

      if(place &&  place.length !==0){
        const error = new Error("Cannot delete category because it has a place!");
        error.statusCode = 422;
        throw error;
      }
      const oldCategpry = category;
  
      category.title = req.body.title || oldCategpry.title;
      await category.save();
      res.status(200).send(category);
    } catch (error) {
      next(error);
    }
  };


  exports.deleteCategory = async (req, res, next) => {
    const categoryId = req.params.categoryId;
  
    try {
      const category = await Category.findById(categoryId);
     

      if (!category) {
        const error = new Error("This category does not exist!");
        error.statusCode = 422;
        throw error;
      }
      const place = await Place.find({category:req.params.categoryId});

      if(place &&  place.length !==0){
        const error = new Error("Cannot delete category because it has a place!");
        error.statusCode = 422;
        throw error;
      }

      await Category.deleteOne({ _id: categoryId });

      res.status(200).json({ message: "Deleted category!" });
    } catch (error) {
      next(error);
    }
  };


    

  
  

