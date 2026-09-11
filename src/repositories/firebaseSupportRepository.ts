import {
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { auth, db } from '../firebase/client'
import type { ConversationStatus, Priority } from '../types/support'
import type {
  NewRealtimeCase,
  RealtimeConversation,
  RealtimeMessage,
  RealtimeProfile,
  RealtimeRole,
} from '../types/realtime'

const requireFirebase = () => {
  if (!auth || !db) throw new Error('Realtime mode is not configured yet.')
  return { auth, db }
}

const asDate = (value: { toDate?: () => Date } | undefined) => value?.toDate?.() ?? new Date()

const conversationFromDoc = (snapshot: QueryDocumentSnapshot<DocumentData>): RealtimeConversation => {
  const data = snapshot.data()
  return {
    id: snapshot.id,
    customerId: data.customerId,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    subject: data.subject,
    status: data.status,
    priority: data.priority,
    assignedAgentId: data.assignedAgentId ?? null,
    assignedAgentName: data.assignedAgentName ?? null,
    agentUnreadCount: data.agentUnreadCount ?? 0,
    customerUnreadCount: data.customerUnreadCount ?? 0,
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt),
  }
}

const messageFromDoc = (snapshot: QueryDocumentSnapshot<DocumentData>): RealtimeMessage => {
  const data = snapshot.data()
  return {
    id: snapshot.id,
    authorId: data.authorId,
    authorRole: data.authorRole,
    authorName: data.authorName,
    body: data.body,
    createdAt: asDate(data.createdAt),
  }
}

const readProfile = async (user: User): Promise<RealtimeProfile> => {
  const { db } = requireFirebase()
  const snapshot = await getDoc(doc(db, 'profiles', user.uid))
  if (!snapshot.exists()) throw new Error('No SupportDesk profile exists for this account.')
  const data = snapshot.data()
  return {
    uid: user.uid,
    displayName: data.displayName,
    email: data.email ?? user.email ?? '',
    role: data.role,
  }
}

export const observeRealtimeProfile = (
  callback: (profile: RealtimeProfile | null) => void,
  onError: (error: Error) => void,
): Unsubscribe => {
  const services = requireFirebase()
  return onAuthStateChanged(services.auth, async (user) => {
    if (!user) {
      callback(null)
      return
    }
    try {
      callback(await readProfile(user))
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Unable to restore the realtime session.'))
      callback(null)
    }
  })
}

export const createRealtimeCustomerAccount = async (
  displayName: string,
  email: string,
  password: string,
): Promise<RealtimeProfile> => {
  const services = requireFirebase()
  const credential = await createUserWithEmailAndPassword(services.auth, email.trim(), password)
  const profile: RealtimeProfile = {
    uid: credential.user.uid,
    displayName: displayName.trim(),
    email: email.trim(),
    role: 'customer',
  }

  await setDoc(doc(services.db, 'profiles', profile.uid), profile)
  return profile
}

export const signInRealtimeCustomer = async (email: string, password: string): Promise<RealtimeProfile> => {
  const services = requireFirebase()
  const credential = await signInWithEmailAndPassword(services.auth, email.trim(), password)
  const profile = await readProfile(credential.user)
  if (profile.role !== 'customer') {
    await signOut(services.auth)
    throw new Error('This account is not a customer account.')
  }
  return profile
}

export const signInRealtimeAgent = async (email: string, password: string): Promise<RealtimeProfile> => {
  const services = requireFirebase()
  const credential = await signInWithEmailAndPassword(services.auth, email.trim(), password)
  const profile = await readProfile(credential.user)
  if (profile.role !== 'agent') {
    await signOut(services.auth)
    throw new Error('This account is not provisioned as a support agent.')
  }
  return profile
}

export const signOutRealtime = async () => {
  const services = requireFirebase()
  await signOut(services.auth)
}

export const createRealtimeCase = async (
  profile: RealtimeProfile,
  input: NewRealtimeCase,
): Promise<string> => {
  const { db } = requireFirebase()
  const conversationRef = doc(collection(db, 'conversations'))
  const openingMessageRef = doc(collection(conversationRef, 'messages'))
  const batch = writeBatch(db)

  batch.set(conversationRef, {
    customerId: profile.uid,
    customerName: input.customerName.trim(),
    customerEmail: input.customerEmail.trim(),
    subject: input.subject.trim(),
    status: 'open',
    priority: 'normal',
    assignedAgentId: null,
    assignedAgentName: null,
    agentUnreadCount: 1,
    customerUnreadCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  batch.set(openingMessageRef, {
    authorId: profile.uid,
    authorRole: 'customer',
    authorName: profile.displayName,
    body: input.message.trim(),
    createdAt: serverTimestamp(),
  })

  await batch.commit()
  return conversationRef.id
}

export const subscribeRealtimeConversations = (
  profile: RealtimeProfile,
  callback: (conversations: RealtimeConversation[]) => void,
  onError: (error: Error) => void,
): Unsubscribe => {
  const { db } = requireFirebase()
  const base = collection(db, 'conversations')
  const source = profile.role === 'customer'
    ? query(base, where('customerId', '==', profile.uid))
    : query(base)

  return onSnapshot(source, (snapshot) => {
    const conversations = snapshot.docs
      .map(conversationFromDoc)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    callback(conversations)
  }, (error) => onError(error))
}

export const subscribeRealtimeMessages = (
  conversationId: string,
  callback: (messages: RealtimeMessage[]) => void,
  onError: (error: Error) => void,
): Unsubscribe => {
  const { db } = requireFirebase()
  return onSnapshot(collection(db, 'conversations', conversationId, 'messages'), (snapshot) => {
    const messages = snapshot.docs
      .map(messageFromDoc)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    callback(messages)
  }, (error) => onError(error))
}

export const markRealtimeConversationRead = async (
  conversationId: string,
  role: RealtimeRole,
) => {
  const { db } = requireFirebase()
  await updateDoc(doc(db, 'conversations', conversationId), role === 'agent'
    ? { agentUnreadCount: 0 }
    : { customerUnreadCount: 0 })
}

export const sendRealtimeMessage = async (
  conversationId: string,
  profile: RealtimeProfile,
  body: string,
) => {
  const { db } = requireFirebase()
  const trimmed = body.trim()
  if (!trimmed) return

  const conversationRef = doc(db, 'conversations', conversationId)
  const conversationSnapshot = await getDoc(conversationRef)
  if (!conversationSnapshot.exists()) throw new Error('This support case no longer exists.')

  if (profile.role === 'agent' && conversationSnapshot.data().assignedAgentId !== profile.uid) {
    throw new Error('Assign this case to yourself before sending a reply.')
  }

  const messageRef = doc(collection(conversationRef, 'messages'))
  const batch = writeBatch(db)

  batch.set(messageRef, {
    authorId: profile.uid,
    authorRole: profile.role,
    authorName: profile.displayName,
    body: trimmed,
    createdAt: serverTimestamp(),
  })

  if (profile.role === 'customer') {
    batch.update(conversationRef, {
      updatedAt: serverTimestamp(),
      status: 'open',
      agentUnreadCount: increment(1),
    })
  } else {
    batch.update(conversationRef, {
      updatedAt: serverTimestamp(),
      customerUnreadCount: increment(1),
      agentUnreadCount: 0,
    })
  }

  await batch.commit()
}

export const assignRealtimeConversation = async (
  conversationId: string,
  agent: RealtimeProfile,
) => {
  const { db } = requireFirebase()
  await updateDoc(doc(db, 'conversations', conversationId), {
    assignedAgentId: agent.uid,
    assignedAgentName: agent.displayName,
    updatedAt: serverTimestamp(),
  })
}

export const updateRealtimeConversation = async (
  conversationId: string,
  changes: { status?: ConversationStatus; priority?: Priority },
) => {
  const { db } = requireFirebase()
  await updateDoc(doc(db, 'conversations', conversationId), {
    ...changes,
    updatedAt: serverTimestamp(),
  })
}
