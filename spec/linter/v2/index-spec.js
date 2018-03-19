/* @flow */
/* eslint-env jasmine */

import { findCached, exec } from 'atom-linter'
import * as LinterV2 from '../../../lib/linter/v2'

function fileUrl(file, row, column) {
  return `atom://linter?file=${encodeURIComponent(file)}&row=${row}&column=${column}`
}

describe('linter/v2', function() {
  const flowBin = findCached(__dirname, 'node_modules/.bin/flow')

  describe('toLinterMessages', function() {
    it('only excerpt', function() {
      const code = `// @flow

      type Human = { name: string }

      function getAge({ age }): number {
        return age
      }

      const p1: Human = { name: 'John Doe' }
      getAge(p1)`

      /* flow status
        Cannot call getAge with p1 bound to the first parameter because property age is missing in Human [1].

              7| }
              8|
         [1]  9| const p1: Human = { name: 'John Doe' }
             10| getAge(p1)
             11|
      */

      let result = null
      waitsForPromise(async () => {
        result = await exec(flowBin, ['check-contents', '--json', '--json-version=2'], { stdin: code })

        const messages = LinterV2.toLinterMessages(result, __filename)
        expect(messages.length).toEqual(1)
        expect(messages[0].excerpt).toEqual('Cannot call getAge with p1 bound to the first parameter because property age is missing in Human.')
      })
    })

    it('with description', function() {
      const code = `// @flow

      type Human = { name: string }
      type Man = Human & { gender: 'male' }

      function getAge({ age }): number {
        return age
      }

      const p1: Man = { name: 'John Doe', gender: 'male' }
      getAge(p1)`

      /* flow status
        Cannot call getAge with p1 bound to the first parameter because:
         - Either property age is missing in Human [1].
         - Or property age is missing in object type [2].

         [1][2]  4| type Man = Human & { gender: 'male' }
                 5|
                 6| function getAge({ age }): number {
                 7|   return age
                 8| }
                 9|
                10| const p1: Man = { name: 'John Doe', gender: 'male' }
                11| getAge(p1)
                12|
      */

      let result = null
      waitsForPromise(async () => {
        result = await exec(flowBin, ['check-contents', '--json', '--json-version=2'], { stdin: code })

        const messages = LinterV2.toLinterMessages(result, __filename)
        expect(messages.length).toEqual(1)
        expect(messages[0].excerpt).toEqual('Cannot call getAge with p1 bound to the first parameter because:')
        expect(messages[0].description).toEqual(
          ` - Either property \`age\` is missing in [\`Human\`](${fileUrl(__filename, 3, 17)}).\n` +
          ` - Or property \`age\` is missing in [object type](${fileUrl(__filename, 3, 25)}).`,
        )
      })
    })
  })
})
