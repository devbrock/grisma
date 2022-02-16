const schema = `
type User {
  firstName: String
  lastName: String
}

type Query {
  users: [User]
}
`;

export default schema;
