import React, { useState, useEffect, useReducer, useCallback, useRef } from "react"
import axios from "axios"
import { sortBy } from "lodash"

const title = "My Hacker Stories"

const API_ENDPOINT = "https://hn.algolia.com/api/v1/search?query="

const storiesReducer = (state, action) => {
  switch (action.type) {
    case "STORIES_FETCH_INIT":
      return {
        ...state,
        isLoading: true,
        isError: false
      }
    case "STORIES_FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload
      }
    case "STORIES_FETCH_FAILURE":
      return {
        ...state,
        isLoading: false,
        isError: true
      }
    case "REMOVE_STORY":
      return {
        ...state,
        data: state.data.filter(story => action.payload.objectID !== story.objectID)
      }
    default:
      throw new Error()
  }
}

//custom hook
const useStorageState = (key, initialState) => {
  const isMounted = useRef(false)
  const [value, setValue] = useState(localStorage.getItem(key) || initialState)

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true
    } else {
      localStorage.setItem(key, value)
    }
  }, [value, key])

  return [value, setValue]
}

const getSumComments = stories => {
  return stories.data.reduce((result, value) => result + value.num_comments, 0)
}
const App = () => {
  // you can do something inbetween
  const [searchTerm, setSearchTerm] = useStorageState("search", "React")
  const [url, setUrl] = useState(`${API_ENDPOINT}${searchTerm}`)
  const [stories, dispatchStories] = useReducer(storiesReducer, { data: [], isLoading: false, isError: false })

  const sumComments = getSumComments(stories)
  //Memoization using useCallback
  const handleFetchStories = useCallback(async () => {
    dispatchStories({ type: "STORIES_FETCH_INIT" })
    try {
      const result = await axios.get(url)

      dispatchStories({
        type: "STORIES_FETCH_SUCCESS",
        payload: result.data.hits
      })
    } catch {
      dispatchStories({ type: "STORIES_FETCH_FAILURE" })
    }
  }, [url])

  useEffect(() => {
    handleFetchStories()
  }, [handleFetchStories])

  const handleRemoveStory = useCallback(item => {
    dispatchStories({
      type: "REMOVE_STORY",
      payload: item
    })
  }, [])

  const handleSearchInput = event => {
    setSearchTerm(event.target.value)
  }

  const handleSearchSubmit = event => {
    setUrl(`${API_ENDPOINT}${searchTerm}`)
    event.preventDefault()
  }

  return (
    <>
      <h1>{`My ${title} with ${sumComments} comments.`}</h1>
      <SearchForm searchTerm={searchTerm} onSearchInput={handleSearchInput} onSearchSubmit={handleSearchSubmit} />
      {stories.isError && <p>Something went wrong...</p>}
      {stories.isLoading ? <p>Loading ...</p> : <List list={stories.data} onRemoveItem={handleRemoveStory} />}
    </>
  )
}

const SearchForm = ({ searchTerm, onSearchInput, onSearchSubmit }) => {
  return (
    <form onSubmit={onSearchSubmit}>
      <InputWithLabel id="search" value={searchTerm} onInputChange={onSearchInput} isFocused>
        <strong>Search:</strong>
      </InputWithLabel>
      <button type="submit" disabled={!searchTerm}>
        Submit
      </button>
    </form>
  )
}
const InputWithLabel = ({ id, value, onInputChange, type = "text", children, isFocused }) => {
  //A
  const inputRef = useRef()

  //C
  useEffect(() => {
    if (isFocused && inputRef.current) {
      //D
      inputRef.current.focus()
    }
  }, [isFocused])
  return (
    <>
      <label htmlFor={id}>{children} </label>
      {/* B */}
      <input ref={inputRef} value={value} id="search" type={type} onChange={onInputChange} autoFocus={isFocused} />
    </>
  )
}

const SORTS = {
  NONE: list => list,
  TITLE: list => sortBy(list, "title"),
  AUTHOR: list => sortBy(list, "author"),
  COMMENT: list => sortBy(list, "num_comments").reverse(),
  POINT: list => sortBy(list, "points").reverse()
}

const List = ({ list, onRemoveItem }) => {
  const [sort, setSort] = useState({
    sortKey: "NONE",
    isReverse: false
  })

  const handleSort = sortKey => {
    const isReverse = sort.sortKey === sortKey && !sort.isReverse
    setSort({ sortKey, isReverse })
  }

  const sortFunction = SORTS[sort.sortKey]
  const sortedList = sort.isReverse ? sortFunction(list).reverse() : sortFunction(list)

  return (
    <ul>
      <li style={{ display: "flex" }}>
        <span style={{ width: "40%" }}>
          <button type="button" onClick={() => handleSort("TITLE")}>
            Title
          </button>
        </span>
        <span style={{ width: "30%" }}>
          <button type="button" onClick={() => handleSort("AUTHOR")}>
            Author
          </button>
        </span>
        <span style={{ width: "10%" }}>
          <button type="button" onClick={() => handleSort("COMMENT")}>
            Comments
          </button>
        </span>
        <span style={{ width: "10%" }}>
          <button type="button" onClick={() => handleSort("POINT")}>
            Points
          </button>
        </span>
        <span style={{ width: "10%" }}>Actions</span>
      </li>
      {sortedList.map(item => (
        <Item key={item.objectID} item={item} onRemoveItem={onRemoveItem} />
      ))}
    </ul>
  )
}
const Item = ({ item, onRemoveItem }) => {
  return (
    <li style={{ display: "flex" }}>
      <span style={{ width: "40%" }}>
        <a href={item.url}>{item.title}</a>
      </span>{" "}
      <span style={{ width: "30%" }}>{item.author}</span>
      <span style={{ width: "10%" }}>{item.num_comments}</span>
      <span style={{ width: "10%" }}>{item.points}</span>
      {"    "}
      <span style={{ width: "10%" }}>
        <button type="button" onClick={() => onRemoveItem(item)}>
          Dismiss
        </button>
      </span>
    </li>
  )
}
export default App

// router, redux, array.sum, 404 page redirection in router, switch with no return in router, async await inside redux, useEffect async await, anonymous function inside useEffect, how to call anyonous function