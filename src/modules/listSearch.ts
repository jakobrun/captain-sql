import { highlight, single } from 'fuzzysort'
export interface IResultItem<I> {
    highlighted: string[]
    score: number
    item: I
}

export type ValuesToSearch<I> = (item: I) => string[]

export interface ISearchParams<I> {
    searchValue: string
    list: I[]
    valuesToSearch: ValuesToSearch<I>
    highlightOpen?: string
    highlightClose?: string
}
export const search = <I>({
    searchValue,
    list,
    valuesToSearch,
    highlightOpen = '<span class="match">',
    highlightClose = '</span>',
}: ISearchParams<I>): Array<IResultItem<I>> => {
    if (!searchValue) {
        return list.map(item => ({
            highlighted: valuesToSearch(item),
            score: -Infinity,
            item,
        }))
    }
    return list
        .reduce(
            (arr, item) => {
                const values = valuesToSearch(item)
                const results = values.map(v => single(searchValue, v))
                if (results.some(result => Boolean(result))) {
                    const resultItem: IResultItem<I> = {
                        item,
                        score: Math.max(
                            ...results.map(res => (res ? res.score : -Infinity))
                        ),
                        highlighted: results.map((res, i) => {
                            if (res) {
                                return (
                                    highlight(
                                        res,
                                        highlightOpen,
                                        highlightClose
                                    ) || ''
                                )
                            }
                            return values[i]
                        }),
                    }
                    arr.push(resultItem)
                }
                return arr
            },
            [] as Array<IResultItem<I>>
        )
        .sort((a, b) => {
            if (a.score > b.score) {
                return -1
            } else if (a.score < b.score) {
                return 1
            }
            return 0
        })
}
