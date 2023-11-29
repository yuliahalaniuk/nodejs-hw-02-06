import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";

// const contactsPath = path.resolve("models", "contacts.json");
const contactsPath = path.join("models", "contacts.json");

export const listContacts = async () => {
  const data = await fs.readFile(contactsPath, { encoding: "UTF-8" });
  return JSON.parse(data);
};

export const getContactById = async (contactId) => {
  const contactList = await listContacts();
  const contact = contactList.filter((contact) => contact.id === contactId);
  return contact || null;
};

export const removeContact = async (contactId) => {
  const contactList = await listContacts();
  const filteredContacts = contactList.filter(
    (contact) => contact.id !== contactId
  );

  await fs.writeFile(contactsPath, JSON.stringify(filteredContacts, null, 2));

  return filteredContacts;
};

export const addContact = async (body) => {
  const contactList = await listContacts();
  const newContact = {
    id: nanoid(),
    ...body,
  };

  await fs.writeFile(
    contactsPath,
    JSON.stringify([...contactList, newContact], null, 2)
  );

  return [...contactList, newContact];
};

export const updateContact = async (contactId, body) => {
  console.log("in body", body);
  const contacts = await listContacts();
  const index = contacts.findIndex((contact) => contact.id === contactId);
  if (index === -1) {
    return null;
  }
  contacts[index] = { contactId, ...body };
  await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2));
  return contacts[index];
};

// export default {
//   listContacts,
//   getContactById,
//   removeContact,
//   addContact,
//   updateContact,
// };
