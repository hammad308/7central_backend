class APIFeatures {
    constructor(query, queryStr) {
        this.query = query;
        this.queryStr = queryStr;
    }

    filter() {
        // Start with a clean query object
        let queryObj = { ...this.queryStr };
        const excludeFields = ['sort', 'limit', 'page', 'fields', 'pageSize'];
        excludeFields.forEach((el) => delete queryObj[el]);

        // Include all remaining fields from queryObj
        let queryStr = { ...queryObj };

        // Handle special status field if present (already in queryStr)
        if (queryObj.status) {
            queryStr.status = queryObj.status;
        }

        // Handle keyword search
        if (queryObj.keyword) {
            const keywordQuery = {
                $or: [
                    { name: { $regex: queryObj.keyword, $options: 'i' } },
                    { title: { $regex: queryObj.keyword, $options: 'i' } },
                    { username: { $regex: queryObj.keyword, $options: 'i' } },
                    { email: { $regex: queryObj.keyword, $options: 'i' } },
                    { cnic: { $regex: queryObj.keyword, $options: 'i' } },
                    { phone: { $regex: queryObj.keyword, $options: 'i' } },
                    { phoneNumber: { $regex: queryObj.keyword, $options: 'i' } },
                    { phoneNumber2: { $regex: queryObj.keyword, $options: 'i' } },
                    { whatsappNumber: { $regex: queryObj.keyword, $options: 'i' } },
                    { whatsappNumber2: { $regex: queryObj.keyword, $options: 'i' } },
                    { city: { $regex: queryObj.keyword, $options: 'i' } },
                    { province: { $regex: queryObj.keyword, $options: 'i' } },
                    { number: { $regex: queryObj.keyword, $options: 'i' } },
                    { fullNumber: { $regex: queryObj.keyword, $options: 'i' } },
                ],
            };
            // Remove keyword from queryStr and add the $or condition
            delete queryStr.keyword;
            queryStr = { ...queryStr, ...keywordQuery };
        }

        this.query = this.query.find(queryStr);
        this.queryObj = { ...queryStr };
        return this;
    }
    sort() {
        if (this.queryStr.sort) {
            const [field, order] = this.queryStr.sort.split(':');
            const sortOrder = order === 'asc' ? 1 : -1;
            this.query = this.query.sort({ [field]: sortOrder });
        } else {
            this.query = this.query.sort({ createdAt: -1 });
        }
        return this;
    }
    limitFields() {
        if (this.queryStr.fields) {
            let fields = this.queryStr.fields.split(",").join(" ");
            this.query = this.query.select(fields)
        } else {
            this.query = this.query.select('-__v -password')
        }
        return this;
    }
    paginate() {
        const page = this.queryStr.page * 1 || 1;
        const pageSize = this.queryStr.pageSize * 1 || 12;
        const skip = (page - 1) * pageSize;
        this.query.skip(skip).limit(pageSize)
        this.pageSize = pageSize;
        this.page = page;
        return this;
    }
}

module.exports = APIFeatures;