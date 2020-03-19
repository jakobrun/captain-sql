import { expect } from 'chai'
import { centerItem } from '../centerItem'

describe('center item', () => {
    const examples = [
        [1, 3, 0],
        [0, 3, 1],
        [2, 3, -1],
        [0, 5, 2],
        [4, 5, -2],
        [1, 5, 1],
        [2, 5, 0],
        [3, 5, -1],
        [0, 2, 0.5],
        [1, 2, -0.5],
        [0, 4, 1.5],
    ]
    examples.map(([index, length, expectedValue]) => {
        it(`should center item [${index}, ${length}, ${expectedValue}]`, () => {
            expect(centerItem(index, length)).to.equal(expectedValue)
        })
    })
})
