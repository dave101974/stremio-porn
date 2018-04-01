class AdapterBase {
  static SUPPORTED_TYPES = []

  _normalizeItemResult(item) {
    return item
  }

  _normalizeStreamResult(stream) {
    return stream
  }

  _paginate(request, itemsPerPage = this.constructor.ITEMS_PER_PAGE) {
    let {
      skip = 0,
      limit = itemsPerPage,
    } = request
    let firstPage = Math.ceil((skip + 0.1) / itemsPerPage) || 1
    let pageCount = Math.ceil(limit / itemsPerPage)
    let pages = []

    for (let i = firstPage; pages.length < pageCount; i++) {
      pages.push(i)
    }

    return {
      pages, skip, limit,
      skipOnFirstPage: skip % itemsPerPage,
    }
  }

  async _find(query, pagination) {
    let {
      pages,
      limit = Infinity,
      skipOnFirstPage = 0,
    } = pagination

    let requests = pages.map((page) => {
      return this._findByPage(query, page)
    })

    let results = await Promise.all(requests)
    results = [].concat(...results)
    return results.slice(skipOnFirstPage, skipOnFirstPage + limit)
  }

  async find(request) {
    let { SUPPORTED_TYPES } = this.constructor

    if (!SUPPORTED_TYPES.includes(request.query.type)) {
      throw new Error(`Content type ${request.query.type} is not supported`)
    }

    let pagination = this._paginate(request)
    let results = await this._find(request.query, pagination)
    return results.map((item) => this._normalizeItemResult(item))
  }

  async getItem(request) {
    let { type, id } = request.query
    let { SUPPORTED_TYPES } = this.constructor

    if (!SUPPORTED_TYPES.includes(type)) {
      throw new Error(`Content type ${type} is not supported`)
    }

    let result = await this._getItem(type, id)
    return result ? [this._normalizeItemResult(result)] : []
  }

  async getStreams(request) {
    let { type, id } = request.query
    let { SUPPORTED_TYPES } = this.constructor

    if (!SUPPORTED_TYPES.includes(type)) {
      throw new Error(`Content type ${type} is not supported`)
    }

    let results = await this._getStreams(type, id)
    return results.map((stream) => this._normalizeStreamResult(stream))
  }
}


export default AdapterBase
