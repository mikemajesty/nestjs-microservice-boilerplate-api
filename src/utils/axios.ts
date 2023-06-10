export class AxiosConverter {

  static getCurl(request: any = {}): string {
    if (!request?.config) return 'Axios error is required';

    request = request.config

    let header = '';
    Object.keys(request?.headers || {}).forEach((r) => (header += `--header '${r}: ${request.headers[String(r)]}' `));

    let params = '';
    Object.keys(request?.params || {}).forEach((p) => (params += `/${p}/${request.params[String(p)]}`));

    const hasQueryParams = new RegExp('\\?.*').exec(request.url) || [];

    let query = ''
    if (hasQueryParams.length) {
      query = hasQueryParams[0]
      request.url = request.url.substring(0, request.url.lastIndexOf('?'))
    }


    const body = `--data-raw '${request?.data}'`;
    const paramsUrl = `${request?.params ? params : ''}`;

    const curl = `curl --location -g --request ${request.method.toUpperCase()} '${request.url + paramsUrl + query}' ${header} ${request?.data ? body : ''}`;

    return curl.trim();
  }
}