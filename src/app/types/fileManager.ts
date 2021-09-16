

export abstract class FileManager {
  static ReadFileSync(path: string) {
    var request = new XMLHttpRequest();
    request.open('GET', path, false);
    request.send(null)

    if (request.status === 200)
      return request.responseText;
    else
      return null;
  }
}