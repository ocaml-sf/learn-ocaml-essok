export function ownDefault<T> ({ dev, test, all }:
                              {dev: T, test: T, all: T}) {
  switch (process.env.NODE_ENV) {
    case 'test':
      return test
    case 'development':
      return dev
    default:
      return all
  }
}
