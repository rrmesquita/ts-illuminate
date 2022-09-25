import _each from 'lodash/each'
import _extend from 'lodash/extend'
import _first from 'lodash/first'
import _flatten from 'lodash/flatten'
import _has from 'lodash/has'
import _keys from 'lodash/keys'
import _uniq from 'lodash/uniq'

type Messages = Record<string, string[]>
type ConstructorMessages = Record<string, string>

function escapeRegExp(str: string) {
  // http://kevin.vanzonneveld.net
  // +   original by: booeyOH
  // +   improved by: Ates Goral (http://magnetiq.com)
  // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +   bugfixed by: Onno Marsman
  // *     example 1: preg_quote("$40");
  // *     returns 1: '\$40'
  // *     example 2: preg_quote("*RRRING* Hello?");
  // *     returns 2: '\*RRRING\* Hello\?'
  // *     example 3: preg_quote("\\.+*?[^]$(){}=!<>|:");
  // *     returns 3: '\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:'

  return (str + '').replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:])/g, '\\$1')
}

const stringMatch = (pattern: string, value: string) => {
  // If the given value is an exact match we can of course return true right
  // from the beginning. Otherwise, we will translate asterisks and do an
  // actual pattern match against the two strings to see if they match.
  if (pattern === value) {
    return true
  }

  // Asterisks are translated into zero-or-more regular expression wildcards
  // to make it convenient to check if the strings starts with the given
  // pattern such as "library/*", making any string check convenient.
  pattern = escapeRegExp(pattern).replaceAll('\\*', '.*')

  if (value.match('^' + pattern)) {
    return true
  }

  return false
}

class MessageBag {
  /**
   * All of the registered messages.
   */
  protected _messages: Messages = {}

  /**
   * Default format for message output.
   */
  protected _format = ':message'

  /**
   * Create a new message bag instance.
   */
  public constructor(messages: Messages | ConstructorMessages = {}) {
    _each(messages, (message, key) => {
      this._messages[key] = Array.isArray(message) ? _uniq(message) : [message]
    })
  }

  /**
   * Get a count of all messages.
   */
  public get length() {
    return this.all().length
  }

  /**
   * Get the keys present in the message bag.
   */
  public keys() {
    return _keys(this._messages)
  }

  /**
   * Add a message to the message bag.
   */
  public add(key: string, message: string) {
    if (this.isUnique(key, message)) {
      if (!this._messages[key]) {
        this._messages[key] = []
      }

      this._messages[key].push(message)
    }

    return this
  }

  /**
   * Add a message to the message bag if the given conditional is "true".
   *
   */
  public addIf(check: boolean, key: string, message: string) {
    return check ? this.add(key, message) : this
  }

  /**
   * Determine if a key and message combination already exists.
   */
  protected isUnique(key: string, message: string) {
    return !_has(this._messages, key) || !this._messages[key].includes(message)
  }

  /**
   * Merge a new array of messages into the message bag.
   */
  public merge(messages: Messages | MessageBag) {
    if (messages instanceof MessageBag) {
      messages = messages.getMessageBag().getMessages()
    }

    for (const key of _keys(messages)) {
      if (!Array.isArray(this._messages[key])) {
        this._messages[key] = []
      }

      this._messages = _extend({}, this._messages, {
        [key]: [...this._messages[key], ...messages[key]],
      })
    }

    return this
  }

  /**
   * Determine if messages exist for all of the given keys.
   */
  public has(...key: string[] | [string[]]) {
    if (this.isEmpty()) {
      return false
    }

    if (!key) {
      return this.any()
    }

    const keys: string[] = Array.isArray(key[0]) ? (key[0] as string[]) : (key as string[])

    for (const key of keys) {
      if (this.first(key) === '') {
        return false
      }
    }

    return true
  }

  /**
   * Determine if messages exist for all of the given keys.
   */
  public hasAny(...key: string[] | [string[]]) {
    if (this.isEmpty()) {
      return false
    }

    const keys: string[] = Array.isArray(key[0]) ? (key[0] as string[]) : (key as string[])

    for (const key of keys) {
      if (this.has(key)) {
        return true
      }
    }

    return false
  }

  /**
   * Get the first message from the message bag for a given key.
   */
  public first(key?: string, format?: string) {
    let messages = key
      ? this.get(key, this.checkFormat(format))
      : this.all(this.checkFormat(format))

    // If `messages` is not an array here, it must be a Messages object.\
    // So we get all messaged from the keys available in it.
    if (!Array.isArray(messages)) {
      messages = _flatten(Object.values(messages))
    }

    const firstMessage = _first(messages) || ''

    return Array.isArray(firstMessage) ? (_first(firstMessage) as string) : firstMessage
  }

  /**
   * Get all of the messages from the message bag for a given key.
   */
  public get(key: string, format?: string) {
    if (Array.isArray(this._messages[key])) {
      return this.transform(this._messages[key], this.checkFormat(format), key)
    }

    if (key.indexOf('*')) {
      return this.getMessagesForWildcardKey(key, format)
    }

    return []
  }

  /**
   * Get the messages for a wildcard key.
   */
  protected getMessagesForWildcardKey(key: string, format?: string) {
    const result: Messages = {}

    _each(this._messages, (messages, messageKey) => {
      messages
        .filter(() => stringMatch(key, messageKey))
        .forEach((message) => {
          if (!Array.isArray(result[messageKey])) {
            result[messageKey] = []
          }

          result[messageKey].push(
            ...this.transform([message], this.checkFormat(format), messageKey),
          )
        })
    })

    return result
  }

  /**
   * Get all of the messages for every key in the message bag.
   */
  public all(format?: string) {
    const all: string[] = []

    _each(this._messages, (message, key) => {
      all.push(...this.transform(message, this.checkFormat(format), key))
    })

    return all
  }

  /**
   * Get all of the unique messages for every key in the message bag.
   */
  public unique(format?: string) {
    return _uniq(this.all(format))
  }

  /**
   * Format an array of messages.
   */
  protected transform(messages: string[], format: string, messageKey: string) {
    if (format === ':message') {
      return messages
    }

    return messages.map((message) =>
      format.replaceAll(':message', message).replaceAll(':key', messageKey),
    )
  }

  /**
   * Get the appropriate format based on the given format.
   */
  protected checkFormat(format?: string) {
    return format || this._format
  }

  /**
   * Get the raw messages in the message bag.
   */
  public messages() {
    return this._messages
  }

  /**
   * Get the raw messages in the message bag.
   */
  public getMessages() {
    return this.messages()
  }

  /**
   * Get the messages for the instance.
   */
  public getMessageBag() {
    return this
  }

  /**
   * Get the default message format.
   */
  public getFormat() {
    return this._format
  }

  /**
   * Set the default message format.
   */
  public setFormat(format = ':message') {
    this._format = format

    return this
  }

  /**
   * Determine if the message bag has any messages.
   *
   * @return bool
   */
  public isEmpty() {
    return !this.any()
  }

  /**
   * Determine if the message bag has any messages.
   *
   * @return bool
   */
  public isNotEmpty() {
    return this.any()
  }

  /**
   * Determine if the message bag has any messages.
   */
  public any() {
    return this.count() > 0
  }

  /**
   * Get the number of messages in the message bag.
   */
  public count() {
    let _count = 0

    _each(this._messages, (messages) => (_count += messages.length))

    return _count
  }

  /**
   * Get the instance as an array.
   *
   * @return object
   */
  public toArray() {
    return this.getMessages()
  }

  /**
   * Convert the object to its JSON representation.
   */
  public toJson(space = 2) {
    return JSON.stringify(this._messages, null, space)
  }

  /**
   * Convert the object to its JSON representation.
   */
  public toString() {
    return this.toJson(0)
  }
}

export default MessageBag
