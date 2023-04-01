import { describe, expect, test } from 'vitest'

import MessageBag from '../../../src/Support/MessageBag'

describe('Illuminate/Support/MessageBag', () => {
  test('Uniqueness', () => {
    const container = new MessageBag()

    container.add('foo', 'bar')
    container.add('foo', 'bar')
    const messages = container.getMessages()

    expect(messages['foo']).toStrictEqual(['bar'])
  })

  test('Messages are added', () => {
    const container = new MessageBag()

    container.setFormat(':message')
    container.add('foo', 'bar')
    container.add('foo', 'baz')
    container.add('boom', 'bust')
    const messages = container.getMessages()

    expect(messages['foo']).toStrictEqual(['bar', 'baz'])
    expect(messages['boom']).toStrictEqual(['bust'])
  })

  test('`keys`', () => {
    const container = new MessageBag()

    container.setFormat(':message')
    container.add('foo', 'bar')
    container.add('foo', 'baz')
    container.add('boom', 'bust')
    expect(container.keys()).toStrictEqual(['foo', 'boom'])
  })

  test('Messages may be merged', () => {
    const container = new MessageBag({ username: ['foo'] })

    container.merge({ username: ['bar'] })
    expect(container.getMessages()).toStrictEqual({ username: ['foo', 'bar'] })
  })

  test('Message bags can be merged', () => {
    const container = new MessageBag({ foo: ['bar'] })
    const otherContainer = new MessageBag({ foo: ['baz'], bar: ['foo'] })

    container.merge(otherContainer)
    expect(container.getMessages()).toStrictEqual({ foo: ['bar', 'baz'], bar: ['foo'] })
  })

  test('`get` returns array of messages by key', () => {
    const container = new MessageBag()

    container.setFormat(':message')
    container.add('foo', 'bar')
    container.add('foo', 'baz')
    expect(container.get('foo')).toStrictEqual(['bar', 'baz'])
  })

  test('`get` returns array of messages by implicit key', () => {
    const container = new MessageBag()

    container.setFormat(':message')
    container.add('foo.1', 'bar')
    container.add('foo.2', 'baz')
    expect(container.get('foo.*')).toStrictEqual({ 'foo.1': ['bar'], 'foo.2': ['baz'] })
  })

  test('`first` returns single message', () => {
    const container = new MessageBag()

    container.setFormat(':message')
    container.add('foo', 'bar')
    container.add('foo', 'baz')
    expect(container.first('foo')).toEqual('bar')
  })

  test('`first` returns empty string if no messages found', () => {
    const container = new MessageBag()

    container.setFormat(':message')
    expect(container.first('foo')).toEqual('')
  })

  test('`first` returns single message from dot keys', () => {
    const container = new MessageBag()

    container.setFormat(':message')
    container.add('name.first', 'jon')
    container.add('name.last', 'snow')
    expect(container.first('name.*')).toEqual('jon')
  })

  test('`has` indicates existence', () => {
    const container = new MessageBag()

    container.setFormat(':message')
    container.add('foo', 'bar')
    expect(container.has('foo')).toEqual(true)
  })

  test('`addIf`', () => {
    const container = new MessageBag()

    container.setFormat(':message')
    container.addIf(true, 'foo', 'bar')
    expect(container.has('foo')).toEqual(true)
    container.addIf(false, 'bar', 'biz')
    expect(container.has('bar')).toEqual(false)
  })

  test('`has` with key null', () => {
    const container = new MessageBag()

    container.setFormat(':message')
    container.add('foo', 'bar')
    expect(container.has(null)).toEqual(true)
  })

  test('`hasAny` indicates existence', () => {
    const container = new MessageBag()

    container.setFormat(':message')
    expect(container.hasAny()).toEqual(false)
    container.add('foo', 'bar')
    container.add('bar', 'foo')
    container.add('boom', 'baz')
    expect(container.hasAny(['foo', 'bar'])).toEqual(true)
    expect(container.hasAny('foo', 'bar')).toEqual(true)
    expect(container.hasAny(['boom', 'baz'])).toEqual(true)
    expect(container.hasAny('boom', 'baz')).toEqual(true)
    expect(container.hasAny(['baz'])).toEqual(false)
    expect(container.hasAny('baz')).toEqual(false)
    expect(container.hasAny('baz', 'biz')).toEqual(false)
  })

  test('`hasAny` with key null', () => {
    const container = new MessageBag()

    container.setFormat(':message')
    container.add('foo', 'bar')
    expect(container.hasAny(null)).toEqual(true)
  })

  test('`has` indicates existence of all keys', () => {
    const container = new MessageBag()

    container.setFormat(':message')
    container.add('foo', 'bar')
    container.add('bar', 'foo')
    container.add('boom', 'baz')
    expect(container.has(['foo', 'bar', 'boom'])).toEqual(true)
    expect(container.has(['foo', 'bar', 'boom', 'baz'])).toEqual(false)
    expect(container.has(['foo', 'baz'])).toEqual(false)
  })

  test('`has` indicates none existence', () => {
    const container = new MessageBag()

    container.setFormat(':message')
    expect(container.has('foo')).toEqual(false)
  })

  test('`all` returns all messages', () => {
    const container = new MessageBag()

    container.setFormat(':message')
    container.add('foo', 'bar')
    container.add('boom', 'baz')
    expect(container.all()).toStrictEqual(['bar', 'baz'])
  })

  test('format is respected', () => {
    const container = new MessageBag()

    container.setFormat('<p>:message</p>')
    container.add('foo', 'bar')
    container.add('boom', 'baz')
    expect(container.first('foo')).toEqual('<p>bar</p>')
    expect(container.get('foo')).toStrictEqual(['<p>bar</p>'])
    expect(container.all()).toStrictEqual(['<p>bar</p>', '<p>baz</p>'])
    expect(container.first('foo', ':message')).toEqual('bar')
    expect(container.get('foo', ':message')).toStrictEqual(['bar'])
    expect(container.all(':message')).toStrictEqual(['bar', 'baz'])
    container.setFormat(':key :message')
    expect(container.first('foo')).toEqual('foo bar')
  })

  test('`unique`', () => {
    const container = new MessageBag()

    container.setFormat(':message')
    container.add('foo', 'bar')
    container.add('foo2', 'bar')
    container.add('boom', 'baz')
    expect(container.unique()).toStrictEqual(['bar', 'baz'])
  })

  test('Message Bag returns correct array', () => {
    const container = new MessageBag()

    container.setFormat(':message')
    container.add('foo', 'bar')
    container.add('boom', 'baz')
    expect(container.toArray()).toStrictEqual({
      foo: ['bar'],
      boom: ['baz'],
    })
  })

  test('Message Bag returns expected json', () => {
    const container = new MessageBag()

    container.setFormat(':message')
    container.add('foo', 'bar')
    container.add('boom', 'baz')
    expect(container.toJson(0)).toEqual('{"foo":["bar"],"boom":["baz"]}')
  })

  test('`count` returns correct value', () => {
    const container = new MessageBag()

    expect(container.count()).toEqual(0)
    container.add('foo', 'bar')
    container.add('foo', 'baz')
    container.add('boom', 'baz')
    expect(container.count()).toEqual(3)
  })

  test('Countable', () => {
    const container = new MessageBag()

    container.add('foo', 'bar')
    container.add('boom', 'baz')
    container.merge({ username: ['bar'] })
    expect(container).length(3)
  })

  test('Constructor', () => {
    const container = new MessageBag({
      country: 'Azerbaijan',
      capital: 'Baku',
    })

    expect(container.getMessages()).toStrictEqual({
      country: ['Azerbaijan'],
      capital: ['Baku'],
    })
  })

  test('`first` finds message for wildcard key', () => {
    const container = new MessageBag()

    container.setFormat(':message')
    container.add('foo.bar', 'baz')
    expect(container.first('foo.*')).toEqual('baz')
  })

  test('`isEmpty` true', () => {
    const container = new MessageBag()

    expect(container.isEmpty()).toEqual(true)
  })

  test('`isEmpty` false', () => {
    const container = new MessageBag()

    container.add('foo.bar', 'baz')
    expect(container.isEmpty()).toEqual(false)
  })

  test('`isNotEmpty` true', () => {
    const container = new MessageBag()

    container.add('foo.bar', 'baz')
    expect(container.isNotEmpty()).toEqual(true)
  })

  test('`isNotEmpty` false', () => {
    const container = new MessageBag()

    expect(container.isNotEmpty()).toEqual(false)
  })

  test('`toString`', () => {
    const container = new MessageBag()

    container.add('foo.bar', 'baz')
    expect(container.toString()).toEqual('{"foo.bar":["baz"]}')
  })

  test('`getFormat`', () => {
    const container = new MessageBag()

    container.setFormat(':message')
    expect(container.getFormat()).toEqual(':message')
  })

  test('Constructor uniqueness consistency', () => {
    let messageBag = new MessageBag({
      messages: ['first', 'second', 'third', 'third'],
    })

    let messages = messageBag.getMessages()

    expect(messages['messages']).toStrictEqual(['first', 'second', 'third'])

    messageBag = new MessageBag()
    messageBag.add('messages', 'first')
    messageBag.add('messages', 'second')
    messageBag.add('messages', 'third')
    messageBag.add('messages', 'third')
    messages = messageBag.getMessages()
    expect(messages['messages']).toStrictEqual(['first', 'second', 'third'])
  })
})
