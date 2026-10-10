export class ApiFeatures {
    prismaQuery: any = { where: {} };

    constructor(private queryParams: any) { }

    // 1. الفلترة المباشرة (مثل: role=ADMIN)
    filter(exactFields: string[]) {
        exactFields.forEach((field) => {
            if (this.queryParams[field] !== undefined) {
                this.prismaQuery.where[field] = this.queryParams[field];
            }
        });
        return this;
    }

    // 2. البحث النصي
    search(searchFields: string[]) {
        if (this.queryParams.search) {
            this.prismaQuery.where.OR = searchFields.map((field) => ({
                [field]: { contains: this.queryParams.search, mode: 'insensitive' },
            }));
        }
        return this;
    }

    // 3. تقسيم الصفحات (مع قيم افتراضية تحمي السيرفر)
    paginate(defaultLimit = 10) {
        const page = Number(this.queryParams.page) || 1;
        const limit = Number(this.queryParams.limit) || defaultLimit;

        this.prismaQuery.skip = (page - 1) * limit;
        this.prismaQuery.take = limit;
        return this;
    }

    // 4. الترتيب
    sort(defaultSort = { createdAt: 'desc' }) {
        this.prismaQuery.orderBy = defaultSort;
        return this;
    }

    // 5. استخراج كائن الاستعلام النهائي لبريسما
    get() {
        return this.prismaQuery;
    }
}