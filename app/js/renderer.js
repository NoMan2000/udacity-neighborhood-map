/* global google */
'use strict'
const axios = require('axios')
const ko = require('knockout')
const _ = require('lodash')
const sqlite = require('sqlite3').verbose()
const dbLocation = `${__dirname}/../db/places.sqlite`
const db = new sqlite.Database(dbLocation)
const doc = document
const CLIENT_ID = 'ZKXLXRMMYMQEZHWAHNWFVNA4LEPMKCTL4XGCZPANQHQBXEPZ'
const CLIENT_SECRET = 'ZMJX1RHMRYIEIXY5VEKDOYW5TNWPCAFA0ONJSRU1OPJ0TAHA'
const US_PHONE_LEN = 10
let VIEW_MODEL = null

const modal = doc.querySelector('#modal')
const ERROR_BOX = doc.querySelector('#dangerBox')
const MAP_DIV = doc.querySelector('#map')
const DATALIST = doc.querySelector('#searchLocations')
const DELETE_BUTTON = doc.querySelector('#deleteButton')
const CANCEL_BUTTON = doc.querySelector('#cancelButton')
const closeModalTrigger = doc.querySelector('#closeModal')
const addNewLocation = doc.querySelector('#addNewLocation')
const findNewLocation = doc.querySelector('#findLocation')
const locationResult = doc.querySelector('#locationResult')

const ANIMATION_TIMEOUT = 1400
const MIN_HEIGHT = 500

let initLocations = []

const setMapHeight = () => {
  let offset = doc.querySelector('#list').offsetHeight
  if (offset > MIN_HEIGHT) {
    MAP_DIV.style.height = offset + 'px'
  } else {
    MAP_DIV.style.height = MIN_HEIGHT + 'px'
  }
}

const initialize = () => {
  VIEW_MODEL = new AppViewModel()
  ko.applyBindings(VIEW_MODEL)
}

db.all('SELECT p.id, p.identifier, p.lat, p.long, p.name FROM places AS p', (err, rows) => {
  if (err) {
    throw err
  }
  rows.forEach((row) => {
    initLocations.push(row)
  })
  initialize()
})

let map = null
let previousWindow = null
let previous = null

const errorHandler = (currentErr) => {
  ERROR_BOX.classList.remove('is-hidden')
  let div = doc.createElement('DIV')
  div.innerHTML += currentErr
  ERROR_BOX.appendChild(div)
}

const formatPhone = (phonenum) => {
  phonenum = String(phonenum)
  if (phonenum.length === US_PHONE_LEN) {
    return `(${phonenum.substr(0, 3)}) ${phonenum.substr(3, 3)} -  ${phonenum.substr(6, 4)}`
  }
  return phonenum
}

const Location = class Location {
  constructor (data) {
    this.name = data.name || ''
    this.lat = data.lat || ''
    this.long = data.long || ''
    this.identifier = data.identifier || ''
    this.id = data.id || 0
    this.URL = ''
    this.street = ''
    this.city = ''
    this.phone = ''
    this.visible = ko.observable(true)

    axios.get(this.foursquareURL).then((data) => {
      data = JSON.parse(data.request.responseText)
      let results = data.response.venues[0]
      if (!results) {
        return
      }
      if (results.url) {
        this.URL = results.url
      }
      this.street = results.location.formattedAddress[0]
      this.city = results.location.formattedAddress[1]
      this.phone = results.contact.phone || ''
      this.formattedPhone = formatPhone(this.phone)
    }).catch((err) => {
      let currentErr = err
      let otherErr = currentErr.responseJSON
      if (otherErr) {
        currentErr = otherErr.meta
      }
      Object.values(currentErr).forEach(errorHandler)
    })
    this.latLng = new google.maps.LatLng(data.lat, data.long)
    this.marker = new google.maps.Marker({
      position: this.latLng,
      map: map,
      title: data.name
    })

    ko.computed(() => {
      if (this.visible() === true) {
        this.marker.setMap(map)
      } else {
        this.marker.setMap(null)
      }
      return true
    })

    this.marker.addListener('click', (location) => {
      if (this.marker === previous) {
        return
      }
      Location.removeActive()
      this.showActiveElement()
      this.showInfoContent()

      this.marker.setAnimation(google.maps.Animation.BOUNCE)

      google.maps.event.addListener(this.infoWindow, 'closeclick', () => {
        Location.removeActive()
        this.marker.setAnimation(null)
      })

      global.setTimeout(() => {
        this.marker.setAnimation(null)
      }, ANIMATION_TIMEOUT)
    })

    this.animateEvent = (place, evt) => {
      google.maps.event.trigger(this.marker, 'click')
      google.maps.event.trigger(map, 'resize')
    }

    this.showDialog = (place, evt) => {
      let textField = doc.querySelector('#modalMessage')
      modal.classList.add('is-active')
      textField.textContent = `Delete record ${this.name}?`
      modal.id = this.id
    }
  }

  showInfoContent () {
    this.infoWindow = new google.maps.InfoWindow({
      content: this.createContentString(),
      maxWidth: 250
    })
    if (previousWindow) {
      previousWindow.close()
    }
    previousWindow = this.infoWindow
    this.infoWindow.open(map, this.marker)
    if (previous) {
      previous.setAnimation(null)
    }
    previous = this.marker
  }

  showActiveElement () {
    Location.removeActive()
    let activeEl = document.querySelector(`[data-identifier='${this.identifier}']`)
    Location.addActiveEl(activeEl)
  }

  static addActiveEl (activeEl) {
    activeEl.classList.add('is-active')
  }

  createContentString () {
    return `<section class="info-window-content" id="${this.identifier}">
                        <p class="title">${this.name}</p>
                        <p class="url"><a href="${this.URL}">${this.URL}</a></p>
                        <p class="street">${this.street}</p>
                        <p class="city">${this.city}</p>
                        <p class="phone"><a href="tel:${this.phone}">${this.formattedPhone}</a></p>
                </section>`
  }

  static removeActive () {
    let active = doc.querySelector('#results .is-active')
    if (active) {
      active.classList.remove('is-active')
    }
  }

  get foursquareURL () {
    return `https://api.foursquare.com/v2/venues/search?ll=${this.lat},${this.long}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&v=20160118&query=${this.name}`
  }
}

const AppViewModel = class AppViewModel {
  constructor () {
    this.searchTerm = ko.observable('')

    let centered = AppViewModel.getCenter(initLocations)

    map = new google.maps.Map(MAP_DIV, {
      zoom: 11,
      center: centered
    })
    this.createLocations()
    this.resetBounds()

    this.searchList = ko.computed(() => {
      let filter = this.searchTerm().toLocaleLowerCase()
      if (!filter) {
        return this.locationList().filter((locationItem) => {
          locationItem.visible(true)
          return true
        })
      } else {
        return this.locationList().filter((locationItem) => {
          let string = locationItem.name.toLocaleLowerCase()
          let result = string.search(filter) !== -1
          locationItem.visible(result)
          return result
        })
      }
    })
  }

  resetBounds () {
    let bounds = new google.maps.LatLngBounds()

    this.locationList().forEach((locationItem) => {
      bounds.extend(locationItem.marker.getPosition())
    })
    map.fitBounds(bounds)
    google.maps.event.trigger(map, 'resize')
  }

  static getCenter (initLocations) {
    let latList = []
    let longList = []
    let centered = {
      lat: [],
      lng: []
    }
    initLocations.filter((locationItem) => {
      return locationItem.lat && locationItem.long
    }).forEach((locationItem) => {
      latList.push(locationItem.lat)
      longList.push(locationItem.long)
    })
    centered.lat = AppViewModel.average(latList)
    centered.lng = AppViewModel.average(longList)
    return centered
  }

  createLocations () {
    this.locationList = ko.observableArray([])
    initLocations.forEach((locationItem) => {
      this.appendDataList(locationItem)
      this.locationList.push(new Location(locationItem))
    })
  }

  appendDataList (locationItem) {
    let option = doc.createElement('OPTION')
    option.value = locationItem.name
    DATALIST.appendChild(option)
  }

  static average (arr) {
    return arr.reduce((p, c) => p + c, 0) / arr.length
  }
}

const closeModalFunc = (evt) => {
  modal.classList.remove('is-active')
}

closeModalTrigger.removeEventListener('click', closeModalFunc)
closeModalTrigger.addEventListener('click', closeModalFunc)
CANCEL_BUTTON.removeEventListener('click', closeModalFunc)
CANCEL_BUTTON.addEventListener('click', closeModalFunc)

const resetMapAndMarkers = function () {
  let center = AppViewModel.getCenter(VIEW_MODEL.locationList())
  map.setCenter(center)
  VIEW_MODEL.resetBounds()
  setMapHeight()
}

DELETE_BUTTON.addEventListener('click', (evt) => {
  let id = Number(modal.id)
  db.each(`SELECT p.id, p.identifier, p.lat, p.long, p.name FROM places AS p WHERE id = ${id}`,
    (err, row) => {
      if (err) {
        closeModalFunc()
        throw err
      }
      let foundRow = _.find(initLocations, {id: id})

      if (foundRow) {
        db.run('DELETE FROM places WHERE id = (?)', id, (err, done) => {
          if (err) {
            closeModalFunc()
            throw err
          }
          _.remove(initLocations, (val) => {
            return val.id === id
          })
          VIEW_MODEL.locationList.remove((el) => {
            return el.id === id
          }).forEach((location) => {
            if (location.marker === previous) {
              Location.removeActive()
            }
            location.visible(false)
          })
          resetMapAndMarkers()
          closeModalFunc()
        })
      } else {
        closeModalFunc()
      }
    })
})

let location = null
let lat = null
let long = null
let placeID = null
let validResult = false

const addNewLocationFunc = (evt) => {
  evt.preventDefault()
  if (!validResult) {
    return
  }
  let name = findNewLocation.value
  db.run('INSERT INTO places (name, lat, long, identifier) VALUES (?,?,?,?)', [
    name,
    lat,
    long,
    placeID
  ], function (err) {
    if (err) {
      throw err
    }
    let item = {
      id: this.lastID,
      identifier: placeID,
      lat,
      long,
      name
    }
    initLocations.push(item)
    VIEW_MODEL.appendDataList(item)
    VIEW_MODEL.locationList.push(new Location(item))
    resetMapAndMarkers()
  })
}

let geocoder = new google.maps.Geocoder()

const findNewLocationFunc = (evt) => {
  let address = evt.target.value

  geocoder.geocode({'address': address}, (results, status) => {
    if (status === 'OK') {
      validResult = true
      location = results[0].geometry.location
      lat = location.lat()
      long = location.lng()
      placeID = results[0].place_id
      locationResult.textContent = results[0].formatted_address
    } else {
      validResult = false
      locationResult.textContent = 'Need more data'
    }
  })
}

findNewLocation.removeEventListener('keyup', findNewLocationFunc)
findNewLocation.addEventListener('keyup', findNewLocationFunc)

addNewLocation.removeEventListener('submit', addNewLocationFunc)
addNewLocation.addEventListener('submit', addNewLocationFunc)
