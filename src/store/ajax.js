
export function get (url) {
  const options = {
    credentials: 'include'
  }
  return fetch(url, options)
}

// this function always returns an object. in case of success, the object is
// the JSON sent by the server. in case of any errors, the `error` property
// contains a description of the error.
export async function getJson (url) {
  let resp
  try {
    resp = await fetch(url)
  } catch (e) {
    return { error: e, status: null }
  }

  if (resp.ok) {
    const text = await resp.text()
    let json
    try {
      json = JSON.parse(text)
    } catch (e) {
      json = { error: 'Server sent invalid JSON response', text }
    }

    json.status = resp.status
    return json
  } else {
    return { error: `Server error ${resp.status} (${resp.statusText})`, status: resp.status }
  }
}

export function post (url, body) {
  const options = {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }
  return fetch(url, options).then(r => {
    if (r.ok) {
      return r.json()
    }
    return r
      .text()
      .then(text => Promise.reject(new Error(text || r.statusText)))
  })
}

export function postForm (url, formData) {
  const options = {
    method: 'POST',
    credentials: 'include',
    body: formData
  }
  return fetch(url, options)
}

export function put (url, body) {
  const options = {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }
  return fetch(url, options).then(r => {
    if (r.ok) {
      return r.json()
    }
    return r
      .text()
      .then(text => Promise.reject(new Error(text || r.statusText)))
  })
}
