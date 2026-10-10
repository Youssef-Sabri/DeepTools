export class ApiFeatures {
  prismaQuery: any = { where: {} };

  constructor(private queryParams: any) {}

  // 1. Exact field filtering (e.g. role=ADMIN)
  filter(exactFields: string[]) {
    exactFields.forEach((field) => {
      if (this.queryParams[field] !== undefined) {
        this.prismaQuery.where[field] = this.queryParams[field];
      }
    });
    return this;
  }

  // 2. Case-insensitive search across specified fields
  search(searchFields: string[]) {
    if (this.queryParams.search) {
      this.prismaQuery.where.OR = searchFields.map((field) => ({
        [field]: { contains: this.queryParams.search, mode: "insensitive" },
      }));
    }
    return this;
  }

  // 3. Offset-based pagination with server-safe defaults
  paginate(defaultLimit = 10) {
    const page = Number(this.queryParams.page) || 1;
    const limit = Number(this.queryParams.limit) || defaultLimit;

    this.prismaQuery.skip = (page - 1) * limit;
    this.prismaQuery.take = limit;
    return this;
  }

  // 4. Order by sorting
  sort(defaultSort = { createdAt: "desc" }) {
    this.prismaQuery.orderBy = defaultSort;
    return this;
  }

  // 5. Export compiled Prisma arguments
  get() {
    return this.prismaQuery;
  }
}
