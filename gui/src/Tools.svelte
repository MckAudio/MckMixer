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

  export function FormatPan(_pan) {
    _pan = Math.round(_pan * 2.0 - 100.0);
    let _str = "";
    if (_pan == 0.0) {
      _str = "C";
    } else if (_pan < 0) {
      _str = `L ${Math.abs(_pan)} %`;
    } else {
      _str = `R ${Math.abs(_pan)} %`;
    }
    return _str;
  }

  export function FormatCon(_str) {
    _str = _str.toString();
    return _str.substring(_str.indexOf(":") + 1);
  }

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
  export function GetScrollLeft(elem) {
    var scrollLeft = 0;
    do {
      if (!isNaN(elem.scrollLeft)) {
        scrollLeft += elem.scrollLeft;
      }
    } while((elem = elem.parentElement));
    return scrollLeft;
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
