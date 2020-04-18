<script context="module">
  export function DbToLog(_db, _min, _max) {
    if (_min == undefined) {
      _min = -110.0;
    }
    if (_max == undefined) {
      _max = 0.0;
    }

    _db = Math.max(_min, Math.min(_max, _db));
    return Math.pow((_db - _min) / (_max - _min), 2.0);
  }

  export function LogToDb(_val, _min, _max) {
    if (_min == undefined) {
      _min = -110.0;
    }
    if (_max == undefined) {
      _max = 0.0;
    }
    let _db = Math.sqrt(_val) * (_max - _min) + _min;
    return Math.max(-200.0, _db);
  }

  export function DbToLin(_db) {}

  // https://stackoverflow.com/a/5598797
  export function GetOffsetLeft(elem) {
    var offsetLeft = 0;
    do {
      if (!isNaN(elem.offsetLeft)) {
        offsetLeft += elem.offsetLeft;
      }
    } while ((elem = elem.offsetParent));
    return offsetLeft;
  }
    export function GetOffsetTop(elem) {
    var offsetTop = 0;
    do {
      if (!isNaN(elem.offsetTop)) {
        offsetTop += elem.offsetTop;
      }
    } while ((elem = elem.offsetParent));
    return offsetTop;
  }
</script>
